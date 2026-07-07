import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { CatalogFacade } from '../catalog/catalog.facade';
import { AfipProducer } from '../invoicing/afip.producer';
import { InventoryService } from '../logistics/inventory.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import { AccountsService } from '../finance/accounts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import * as crypto from 'crypto';

@Injectable()
export class CheckoutOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly rulesEngine: RulesEngineService,
    private readonly catalogFacade: CatalogFacade,
    private readonly afipProducer: AfipProducer,
    private readonly inventoryService: InventoryService,
    private readonly settingsService: SettingsService,
    private readonly notificationTriggers: NotificationTriggersService,
    private readonly accountsService: AccountsService,
  ) {}

  /**
   * The master orchestrator for checkout.
   * Runs Sales, Finance, and Inventory mutations inside a single ACID $transaction.
   */
  async processCheckout(dto: CreateOrderDto, cashierUserId?: string) {
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
      const posSettings = await this.settingsService.getPosSettings();
      if (posSettings.boxMode === 'STRICT') {
        if (!cashierUserId || shift.openedByUserId !== cashierUserId) {
          throw new BadRequestException('El modo de caja es ESTRICTO. Solo el usuario que abrió el turno puede registrar ventas.');
        }
      }
    }

    // Load Pricing Settings (from shared cache — no extra DB query)
    const pricingSettings = await this.settingsService.getPricingSettings();

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
      const hasSplitPayments = !isQuote && dto.payments && dto.payments.length > 0;

      if (!isQuote && !hasSplitPayments) {
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
        } else if (!isBackoffice) {
          const treasuryMethod = dto.paymentMethod === 'QR_MERCADOPAGO' ? 'QR_MERCADOPAGO' : dto.paymentMethod;
          const accountId = await this.resolvePaymentAccountId(tx, dto, treasuryMethod);
          if (accountId) {
            const refNote = dto.paymentReference ? ` Ref: ${dto.paymentReference}` : '';
            const description = `Checkout via ${treasuryMethod}${refNote}`;
            await this.postSaleLedgerEntry(
              tx,
              accountId,
              posTotal,
              dto.id,
              description,
              dto.customerId || 'Walk-in',
            );
          }
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

      if (hasSplitPayments) {
        await this.processPaymentSplits(tx, dto, order.id, posTotal);
      } else if (!isQuote && dto.paymentMethod !== 'CUSTOMER_CREDIT') {
        const pmType = dto.paymentMethod === 'QR_MERCADOPAGO' ? 'CREDIT_CARD' : dto.paymentMethod;
        const pm = await tx.paymentMethod.findFirst({ where: { type: pmType, isActive: true } });
        if (pm) {
          await tx.saleOrderPayment.create({
            data: {
              orderId: order.id,
              paymentMethodId: pm.id,
              amount: posTotal,
              referenceId: dto.paymentReference || null,
            },
          });
        }
      }

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

      // --- E. EVENT BOUNDARY (Outbox Pattern) ---
      if (order.status === 'COMPLETED' || order.status === 'PENDING_PAYMENT') {
        await tx.outboxEvent.create({
          data: {
            aggregate: 'SaleOrder',
            aggregateId: order.id,
            type: 'ORDER_CREATED',
            payload: { orderId: order.id, branchId: order.branchId, status: order.status, grandTotal: order.grandTotal }
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

    if (result.status === 'SUCCESS' && result.order && !isQuote) {
      const completedStatuses = ['COMPLETED', 'CONFIRMED', 'PENDING_PAYMENT'];
      if (completedStatuses.includes(result.order.status)) {
        void this.notificationTriggers.onSaleCompleted(result.order.id);
      }
      if (dto.warehouseId && result.order.status !== 'PENDING_PAYMENT') {
        for (const line of result.order.lines) {
          void this.notificationTriggers.checkLowStock(line.variantId, dto.warehouseId, dto.branchId);
        }
      }
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

      // 3. EVENT BOUNDARY (Outbox Pattern)
      await tx.outboxEvent.create({
        data: {
          aggregate: 'SaleOrder',
          aggregateId: updated.id,
          type: 'ORDER_CONFIRMED',
          payload: { orderId: updated.id, branchId: updated.branchId, status: 'CONFIRMED', grandTotal: updated.grandTotal }
        }
      });

      // 4. ENQUEUE AFIP (Post-Confirmation)
      if (updated.issueInvoice) {
        await this.afipProducer.enqueueInvoiceGeneration(updated.id, updated.branchId);
      }

      return updated;
    }).then(async (updated) => {
      void this.notificationTriggers.onSaleCompleted(updated.id);
      for (const line of updated.lines) {
        void this.notificationTriggers.checkLowStock(line.variantId, targetWarehouseId, quote.branchId);
      }
      return updated;
    });
  }

  private async deductStock(tx: any, data: { orderId: string, branchId: string, warehouseId: string, lines: any[] }) {
    for (const line of data.lines) {
      const movements = await this.resolveStockMovements(line.variantId, line.quantity, tx);
      for (const movement of movements) {
        await this.inventoryService.recordMovement({
          variantId: movement.variantId,
          sourceWarehouseId: data.warehouseId,
          destinationWarehouseId: null,
          branchId: data.branchId,
          type: 'SALE_EXIT',
          quantity: movement.quantity,
          unitCost: line.basePrice,
          referenceId: data.orderId
        }, tx);
      }
    }
  }

  private async restoreStock(tx: any, data: { orderId: string, branchId: string, warehouseId: string, lines: any[] }) {
    for (const line of data.lines) {
      const movements = await this.resolveStockMovements(line.variantId, line.quantity, tx);
      for (const movement of movements) {
        await this.inventoryService.recordMovement({
          variantId: movement.variantId,
          sourceWarehouseId: null,
          destinationWarehouseId: data.warehouseId,
          branchId: data.branchId,
          type: 'SALE_RETURN',
          quantity: movement.quantity,
          unitCost: line.basePrice,
          referenceId: `CANCEL-${data.orderId}`,
        }, tx);
      }
    }
  }

  /**
   * Resolves which variant IDs and quantities should move for a sale line.
   * Combos expand into their child variants; regular products use the line variant directly.
   */
  private async resolveStockMovements(
    variantId: string,
    quantity: number,
    tx?: any,
  ): Promise<Array<{ variantId: string; quantity: number }>> {
    const variantWithProduct = await this.catalogFacade.getVariantWithCombos(variantId, tx);

    if (variantWithProduct?.product?.type === 'COMBO') {
      return variantWithProduct.product.comboLines.map(cl => ({
        variantId: cl.childVariantId,
        quantity: quantity * cl.quantity,
      }));
    }

    return [{ variantId, quantity }];
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: {
        lines: true,
        payments: { include: { paymentMethod: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('La orden ya fue cancelada');
    }
    if (!['COMPLETED', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('Solo se pueden cancelar ventas completadas');
    }

    return this.prisma.$transaction(async (tx) => {
      if (order.warehouseId) {
        await this.restoreStock(tx, {
          orderId: order.id,
          branchId: order.branchId,
          warehouseId: order.warehouseId,
          lines: order.lines,
        });
      }

      const ledgerEntries = await tx.financialTransaction.findMany({
        where: { referenceId: order.id, type: 'DEBIT' },
      });
      for (const entry of ledgerEntries) {
        await this.accountsService.postTransactionInTx(
          tx,
          entry.accountId,
          'CREDIT',
          entry.amount,
          `CANCEL-${order.id}`,
          `Reversa venta ${order.id}`,
        );
      }

      if (order.paymentMethod === 'CUSTOMER_CREDIT' && order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { usedCredit: { decrement: order.grandTotal } },
        });
      }

      for (const payment of order.payments) {
        if (payment.paymentMethod.type === 'CUSTOMER_CREDIT' && order.customerId) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { usedCredit: { decrement: payment.amount } },
          });
        }
      }

      return tx.saleOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { lines: true },
      });
    });
  }

  private async resolvePaymentAccountId(
    tx: any,
    dto: CreateOrderDto,
    methodType: string,
  ): Promise<string | null> {
    if (dto.paymentAccountId) return dto.paymentAccountId;

    if (dto.cashShiftId) {
      const shift = await tx.cashShift.findUnique({
        where: { id: dto.cashShiftId },
        include: { cashRegister: { include: { paymentMethods: true } } },
      });
      const registerPm = shift?.cashRegister.paymentMethods.find(
        (p: { type: string; isActive: boolean; accountId?: string | null }) =>
          p.type === methodType && p.isActive,
      );
      if (registerPm?.accountId) return registerPm.accountId;
    }

    const pm = await tx.paymentMethod.findFirst({
      where: { type: methodType, isActive: true },
    });
    return pm?.accountId ?? null;
  }

  private async postSaleLedgerEntry(
    tx: any,
    accountId: string,
    amount: number,
    orderId: string,
    description: string,
    payerName: string,
  ) {
    await this.accountsService.postTransactionInTx(
      tx,
      accountId,
      'DEBIT',
      amount,
      orderId,
      description,
    );
    await tx.treasuryReceipt.create({
      data: {
        accountId,
        amount,
        payerName,
        referenceId: orderId,
        description,
      },
    });
  }

  private async processPaymentSplits(
    tx: any,
    dto: CreateOrderDto,
    orderId: string,
    posTotal: number,
  ) {
    const splits = dto.payments || [];
    const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(splitTotal - posTotal) > 0.01) {
      throw new BadRequestException(`Split payments ($${splitTotal}) must equal order total ($${posTotal})`);
    }

    for (const split of splits) {
      const methodType = split.method === 'QR_MERCADOPAGO' ? 'CREDIT_CARD'
        : split.method === 'DEBIT_CARD' ? 'CREDIT_CARD'
        : split.method === 'STORE_CREDIT' ? 'CUSTOMER_CREDIT'
        : split.method;

      if (methodType === 'CUSTOMER_CREDIT') {
        if (!dto.customerId) throw new BadRequestException('Customer ID required for credit payment');
        const customer = await tx.customer.findUnique({ where: { id: dto.customerId } });
        if (!customer) throw new BadRequestException('Customer not found');
        if (customer.usedCredit + split.amount > customer.creditLimit) {
          throw new BadRequestException('Credit limit exceeded');
        }
        await tx.customer.update({
          where: { id: dto.customerId },
          data: { usedCredit: { increment: split.amount } },
        });
      } else {
        const pm = await tx.paymentMethod.findFirst({
          where: { type: methodType, isActive: true },
          include: { account: true },
        });
        if (pm?.accountId) {
          const description = `Split payment via ${split.method}${split.reference ? ` Ref: ${split.reference}` : ''}`;
          await this.postSaleLedgerEntry(
            tx,
            pm.accountId,
            split.amount,
            orderId,
            description,
            dto.customerId || 'Walk-in',
          );
        }
        if (pm) {
          await tx.saleOrderPayment.create({
            data: {
              orderId,
              paymentMethodId: pm.id,
              amount: split.amount,
              referenceId: split.reference || null,
            },
          });
        }
      }
    }
  }
}
