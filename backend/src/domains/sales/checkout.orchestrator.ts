import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { AfipProducer } from '../invoicing/afip.producer';
import { InventoryService } from '../logistics/inventory.service';
import { CreateOrderDto } from './dto/create-order.dto';
import * as crypto from 'crypto';

@Injectable()
export class CheckoutOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly rulesEngine: RulesEngineService,
    private readonly afipProducer: AfipProducer,
    private readonly inventoryService: InventoryService,
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

    const isQuote = dto.status === 'QUOTE' || dto.status === 'QUOTATION';

    // 1.b SHIFT VALIDATION
    if (!isQuote && (dto.source === 'POS' || (dto.source as string) === 'OFFLINE_POS')) {
      if (!dto.cashShiftId) {
        throw new BadRequestException('Un turno de caja abierto es obligatorio para registrar ventas en el POS.');
      }
      const shift = await this.prisma.cashShift.findUnique({ where: { id: dto.cashShiftId } });
      if (!shift || shift.status !== 'OPEN') {
        throw new BadRequestException('El turno de caja provisto no es válido o ya fue cerrado.');
      }
    }

    // Load Pricing Settings
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const pricingSettings = (settings?.pricing as any) || {};

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
      
      const manualDiscountPct = lineDto.discountPct || 0;
      
      if (manualDiscountPct > 0) {
        if (pricingSettings.allowManualDiscount === false) {
          throw new BadRequestException('Los descuentos manuales están deshabilitados por configuración del sistema.');
        }
        if (pricingSettings.maxDiscountPct && manualDiscountPct > pricingSettings.maxDiscountPct) {
          throw new BadRequestException(`El descuento manual excede el máximo permitido del ${pricingSettings.maxDiscountPct}%`);
        }
      }
      
      const manualDiscountAmount = resolvedBasePrice * (manualDiscountPct / 100);
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

    // 4. Evaluate Promotions (BOGO, Cart Discounts, Category Sales)
    const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
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
        if (dto.status === 'PENDING_PAYMENT') {
          for (const line of finalLinesForDB) {
            await this.inventoryService.reserveStock(
              line.variantId,
              dto.warehouseId,
              dto.branchId,
              line.quantity,
              dto.id,
              tx
            );
          }
        } else {
          await this.deductStock(tx, {
            orderId: dto.id,
            branchId: dto.branchId,
            warehouseId: dto.warehouseId,
            lines: finalLinesForDB
          });
        }
      }

      // --- C. SALES BOUNDARY ---
      const order = await tx.saleOrder.create({
        data: {
          id: dto.id,
          branchId: dto.branchId,
          warehouseId: dto.warehouseId, // SAVE the warehouseId for later confirmation if it's a quote
          source: dto.source,
          customerId: dto.customerId,
          subtotal: cartEvaluation.originalTotal,
          cartDiscountTotal: cartEvaluation.discountTotal,
          grandTotal: posTotal,
          appliedPromotions: cartEvaluation.appliedPromotions,
          paymentMethod: dto.paymentMethod,
          paymentAccountId: dto.paymentAccountId,
          status: dto.status || 'COMPLETED',
          cashShiftId: dto.cashShiftId,
          issueInvoice: dto.issueInvoice ?? true, // Default to true if not specified
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
    if (result.order.issueInvoice) {
      await this.afipProducer.enqueueInvoiceGeneration(result.order.id, dto.branchId);
    }

    return result;
  }

  async confirmQuotation(id: string) {
    const quote = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: { lines: true }
    });

    if (!quote) throw new NotFoundException('Quotation not found');
    if (quote.status !== 'QUOTATION' && quote.status !== 'QUOTE') {
      throw new BadRequestException('Order is already confirmed or cancelled');
    }

    // Use the saved warehouseId or fall back to the first warehouse in the branch if somehow missing
    let targetWarehouseId = (quote as any).warehouseId;
    if (!targetWarehouseId) {
      const branch = await this.prisma.branch.findUnique({ where: { id: quote.branchId }, include: { warehouses: true } });
      if (branch?.warehouses.length) targetWarehouseId = branch.warehouses[0].id;
    }

    if (!targetWarehouseId) throw new BadRequestException('No warehouse specified for stock deduction');

    return this.prisma.$transaction(async (tx) => {
      // 1. DEDUCT STOCK
      await this.deductStock(tx, {
        orderId: quote.id,
        branchId: quote.branchId,
        warehouseId: targetWarehouseId,
        lines: quote.lines.map(l => ({
          variantId: l.variantId,
          quantity: l.quantity,
          basePrice: l.basePrice
        }))
      });

      // 2. UPDATE STATUS
      const updated = await tx.saleOrder.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { lines: true }
      });

      // 3. ENQUEUE AFIP (Post-Confirmation)
      if (updated.issueInvoice) {
        await this.afipProducer.enqueueInvoiceGeneration(updated.id, updated.branchId);
      }

      return updated;
    });
  }

  private async deductStock(tx: any, data: { orderId: string, branchId: string, warehouseId: string, lines: any[] }) {
    for (const line of data.lines) {
      // Handle Combos
      const variantWithProduct = await tx.productVariant.findUnique({
        where: { id: line.variantId },
        include: { product: { include: { comboLines: true } } }
      });

      if (variantWithProduct?.product?.type === 'COMBO') {
        for (const cl of variantWithProduct.product.comboLines) {
          await this.inventoryService.recordMovement({
            variantId: cl.childVariantId,
            sourceWarehouseId: data.warehouseId,
            destinationWarehouseId: null,
            branchId: data.branchId,
            type: 'SALE_EXIT',
            quantity: line.quantity * cl.quantity,
            unitCost: line.basePrice, // Approximate cost distribution can be done later
            referenceId: data.orderId
          }, tx);
        }
      } else {
        await this.inventoryService.recordMovement({
          variantId: line.variantId,
          sourceWarehouseId: data.warehouseId,
          destinationWarehouseId: null,
          branchId: data.branchId,
          type: 'SALE_EXIT',
          quantity: line.quantity,
          unitCost: line.basePrice,
          referenceId: data.orderId
        }, tx);
      }
    }
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.saleOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.saleOrder.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  }
}
