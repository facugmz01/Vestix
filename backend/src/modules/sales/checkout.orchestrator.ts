import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { RulesEngineService } from '../pricing/rules-engine.service';
import { AfipProducer } from '../afip/afip.producer';
import { CreateOrderDto } from './dto/create-order.dto';
import * as crypto from 'crypto';

@Injectable()
export class CheckoutOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly rulesEngine: RulesEngineService,
    private readonly afipProducer: AfipProducer,
  ) {}

  /**
   * The master orchestrator for checkout.
   * Runs Sales, Finance, and Inventory mutations inside a single ACID $transaction.
   */
  async processCheckout(dto: CreateOrderDto) {
    // 1. IDEMPOTENCY CHECK (Outside transaction to fail fast)
    const existingOrder = await this.prisma.saleOrder.findUnique({
      where: { id: dto.id },
    });
    
    if (existingOrder) {
      return { status: 'ALREADY_PROCESSED', order: existingOrder };
    }

    // 2. PRICING EVALUATION (Server-Authoritative)
    const evaluatedLines = [];
    for (const lineDto of dto.lines) {
      const variant = await this.prisma.productVariant.findUnique({ where: { id: lineDto.variantId } });
      if (!variant) throw new BadRequestException(`Variant ${lineDto.variantId} not found`);

      // If a manual override is provided (e.g. from POS or Backoffice), trust it.
      // Otherwise, resolve the price automatically from price lists.
      let resolvedBasePrice: number;
      if (lineDto.unitPriceOverride !== undefined) {
        resolvedBasePrice = lineDto.unitPriceOverride;
      } else {
        resolvedBasePrice = await this.pricingService.resolvePrice(lineDto.variantId, variant.basePrice, dto.customerId);
      }
      
      const manualDiscountAmount = lineDto.discountPct ? (resolvedBasePrice * (lineDto.discountPct / 100)) : 0;
      const finalPriceAfterManualDiscount = resolvedBasePrice - manualDiscountAmount;
      
      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: lineDto.categoryId || 'default_category',
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        manualDiscountAmount: manualDiscountAmount,
        finalPrice: finalPriceAfterManualDiscount
      });
    }

    const cartEvaluation = this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
      id: crypto.randomUUID(),
      variantId: l.variantId,
      categoryId: l.categoryId,
      quantity: l.quantity,
      unitPrice: l.finalPrice // Pass manually discounted price into engine
    })));

    const serverCalculatedTotal = cartEvaluation.finalTotal;
    
    // Merge promotional discounts back into our evaluated lines
    const finalLinesForDB = evaluatedLines.map((line, index) => {
      const promotionalDiscount = cartEvaluation.lines[index].promotionalDiscount;
      const totalDiscountAmount = line.manualDiscountAmount + promotionalDiscount;
      return {
        ...line,
        totalDiscountAmount,
        finalPrice: line.basePrice - (totalDiscountAmount / line.quantity)
      };
    });

    // 3. VARIANCE DETECTION
    // Trust: Accept the grand total if provided by POS or BACKOFFICE
    const isQuote = dto.status === 'QUOTE' || dto.status === 'QUOTATION';
    const isManualEntry = dto.source === 'POS' || dto.source === 'BACKOFFICE' || (dto.source as string) === 'OFFLINE_POS';
    
    let posTotal = serverCalculatedTotal;
    if (isManualEntry && (dto as any).posGrandTotal !== undefined) {
      posTotal = (dto as any).posGrandTotal;
    } else if ((dto as any).posGrandTotal !== undefined && Math.abs((dto as any).posGrandTotal - serverCalculatedTotal) > 0.01) {
      // IF it's a quote, we are more relaxed
      if (isQuote) {
        posTotal = (dto as any).posGrandTotal;
      } else {
        throw new BadRequestException(`Price mismatch. Expected ${serverCalculatedTotal}, got ${(dto as any).posGrandTotal}`);
      }
    }

    const posDifference = posTotal - serverCalculatedTotal;

    // 4. ATOMIC TRANSACTION EXECUTION
    const result = await this.prisma.$transaction(async (tx) => {
      
      const isBackoffice = dto.source === 'BACKOFFICE';

      // --- A. FINANCE BOUNDARY ---
      if (!isQuote) {
        if (dto.paymentMethod === 'CUSTOMER_CREDIT') {
          if (!dto.customerId) throw new BadRequestException('Customer ID required for credit');
          const customer = await tx.customer.findUnique({ where: { id: dto.customerId }});
          if (!customer) throw new BadRequestException('Customer not found');
          
          if (customer.usedCredit + posTotal > customer.creditLimit) {
            throw new BadRequestException('Credit limit exceeded');
          }
          
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { usedCredit: { increment: posTotal } }
          });
        } else if (dto.paymentAccountId && !isBackoffice) {
          await tx.treasuryReceipt.create({
            data: {
              accountId: dto.paymentAccountId,
              amount: posTotal,
              payerName: dto.customerId || 'Walk-in',
              referenceId: dto.id,
              description: `Checkout via ${dto.paymentMethod}`
            }
          });
        }
      }

      // --- B. INVENTORY BOUNDARY ---
      if (!isQuote && dto.warehouseId) {
        for (const line of finalLinesForDB) {
          await tx.inventoryMovement.create({
            data: {
              variantId: line.variantId,
              sourceWarehouseId: dto.warehouseId,
              type: 'SALE_EXIT',
              quantity: line.quantity,
              unitCost: line.basePrice,
              referenceId: dto.id
            }
          });

          const stock = await tx.stockLevel.findUnique({
            where: { variantId_warehouseId: { variantId: line.variantId, warehouseId: dto.warehouseId } }
          });
          
          const wasReserved = (dto as any).wasReserved || false;

          if (stock) {
            await tx.stockLevel.update({
              where: { id: stock.id },
              data: wasReserved 
                ? {
                    physicalQuantity: { decrement: line.quantity },
                    reservedQuantity: { decrement: line.quantity }
                  }
                : {
                    physicalQuantity: { decrement: line.quantity },
                    availableQuantity: { decrement: line.quantity }
                  }
            });
          } else {
            await tx.stockLevel.create({
              data: {
                variantId: line.variantId,
                warehouseId: dto.warehouseId,
                branchId: dto.branchId,
                physicalQuantity: -line.quantity,
                availableQuantity: wasReserved ? 0 : -line.quantity,
                reservedQuantity: wasReserved ? -line.quantity : 0
              }
            });
          }
        }
      }

      // --- C. SALES BOUNDARY ---
      const order = await tx.saleOrder.create({
        data: {
          id: dto.id,
          branchId: dto.branchId,
          source: dto.source,
          customerId: dto.customerId,
          subtotal: cartEvaluation.originalTotal,
          cartDiscountTotal: cartEvaluation.discountTotal,
          grandTotal: posTotal,
          appliedPromotions: cartEvaluation.appliedPromotions,
          paymentMethod: dto.paymentMethod,
          paymentAccountId: dto.paymentAccountId,
          status: dto.status || 'COMPLETED',
          createdAt: dto.createdAtIso ? new Date(dto.createdAtIso) : new Date(),
          lines: {
            create: finalLinesForDB.map(l => ({
              variantId: l.variantId,
              categoryId: l.categoryId,
              quantity: l.quantity,
              basePrice: l.basePrice,
              discountAmount: l.totalDiscountAmount,
              finalPrice: l.finalPrice
            }))
          }
        },
        include: { lines: true }
      });

      // --- D. DATA INTEGRITY BOUNDARY (Price Variance) ---
      if (Math.abs(posDifference) > 0.01) {
        await tx.saleOrderVariance.create({
          data: {
            orderId: order.id,
            posTotal: posTotal,
            serverTotal: serverCalculatedTotal,
            difference: posDifference
          }
        });
      }

      return { status: 'SUCCESS', order };
    });

    // 5. ASYNC EXTERNAL BOUNDARY — Fire and Forget
    // Enqueues AFIP invoice generation AFTER the DB transaction has committed.
    // The HTTP response is returned immediately; the worker handles the slow government API call.
    await this.afipProducer.enqueueInvoiceGeneration(result.order.id, dto.branchId);

    return result;
  }
}
