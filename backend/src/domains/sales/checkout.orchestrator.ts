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
import { CurrentAccountsService } from '../finance/current-accounts.service';
import { expandComboToStockMovements } from '../catalog/utils/combo-stock.util';
import { LoyaltyService } from './loyalty/loyalty.service';
import { GiftCardsService } from './gift-cards/gift-cards.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { applyManualCartDiscount } from './utils/manual-cart-discount';
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
    private readonly currentAccountsService: CurrentAccountsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly giftCardsService: GiftCardsService,
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
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: lineDto.variantId },
        include: { product: true },
      });
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
      
      const resolvedCategoryId = this.resolveLineCategoryId(lineDto.categoryId, variant.product?.categoryId);

      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: resolvedCategoryId,
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        manualDiscountAmount: manualDiscountAmount,
        finalPrice: finalPriceAfterManualDiscount,
        historicalSku: variant.sku,
        historicalName: variant.product?.name || null,
        historicalCost: variant.costPrice ?? null,
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

    const merchandiseTotal = serverCalculatedTotal;

    // Manual cart-level discount (Backoffice global %, POS cart discount).
    // This is additive to promotional discounts already reflected in merchandiseTotal.
    let manualCartDiscount = 0;
    let pricedTotal = merchandiseTotal;
    try {
      const discounted = applyManualCartDiscount({
        merchandiseTotal,
        cartDiscountTotal: dto.cartDiscountTotal,
        allowManualDiscount: pricingSettings.allowManualDiscount,
        maxDiscountPct: pricingSettings.maxDiscountPct,
      });
      manualCartDiscount = discounted.manualCartDiscount;
      pricedTotal = discounted.pricedTotal;
    } catch (err: any) {
      const code = err?.message;
      if (code === 'MANUAL_DISCOUNT_DISABLED') {
        throw new BadRequestException('Los descuentos manuales están deshabilitados por configuración del sistema.');
      }
      if (code === 'CART_DISCOUNT_EXCEEDS_TOTAL') {
        throw new BadRequestException('El descuento global supera el total de la venta');
      }
      if (code === 'CART_DISCOUNT_EXCEEDS_MAX_PCT') {
        throw new BadRequestException(
          `El descuento global excede el máximo permitido del ${pricingSettings.maxDiscountPct}%`,
        );
      }
      throw err;
    }

    // Pre-validate redemptions (read-only) before the atomic transaction
    let expectedGiftCardAmount = 0;
    let expectedLoyaltyAmount = 0;

    if (dto.giftCardRedemption) {
      const balance = await this.giftCardsService.getBalance(dto.giftCardRedemption.code);
      if (balance.balance < dto.giftCardRedemption.amount) {
        throw new BadRequestException('Saldo insuficiente en la gift card');
      }
      expectedGiftCardAmount = dto.giftCardRedemption.amount;
    }

    if (dto.loyaltyRedemption) {
      if (!dto.customerId) {
        throw new BadRequestException('Customer ID required for loyalty redemption');
      }
      const settings = await this.loyaltyService.getSettings();
      if (!settings.enabled) {
        throw new BadRequestException('Programa de fidelización deshabilitado');
      }
      const account = await this.loyaltyService.getOrCreateAccount(dto.customerId);
      if (account.points < dto.loyaltyRedemption.points) {
        throw new BadRequestException('Puntos insuficientes');
      }
      expectedLoyaltyAmount = this.loyaltyService.previewRedeemValue(
        dto.loyaltyRedemption.points,
        settings,
      );
    }

    const expectedAmountDue = Math.round(
      (pricedTotal - expectedGiftCardAmount - expectedLoyaltyAmount) * 100,
    ) / 100;

    if (expectedAmountDue < -0.01) {
      throw new BadRequestException('El canje supera el total de la venta');
    }

    const isManualEntry = dto.source === 'POS' || dto.source === 'BACKOFFICE' || (dto.source as string) === 'OFFLINE_POS';

    if (isManualEntry && dto.posGrandTotal !== undefined) {
      if (Math.abs(dto.posGrandTotal - expectedAmountDue) > 0.01) {
        throw new BadRequestException(
          `Payment mismatch. Expected ${expectedAmountDue} after redemptions, got ${dto.posGrandTotal}`,
        );
      }
    } else if (!isManualEntry && dto.posGrandTotal !== undefined && Math.abs(dto.posGrandTotal - pricedTotal) > 0.01) {
      if (!isQuote) {
        throw new BadRequestException(`Price mismatch. Expected ${pricedTotal}, got ${dto.posGrandTotal}`);
      }
    }

    const posDifference = (dto.posGrandTotal ?? expectedAmountDue) + expectedGiftCardAmount + expectedLoyaltyAmount - pricedTotal;

    // 4. ATOMIC TRANSACTION EXECUTION
    const result = await this.prisma.$transaction(async (tx) => {
      
      const isBackoffice = dto.source === 'BACKOFFICE';

      let giftCardAmount = 0;
      let loyaltyAmount = 0;

      if (!isQuote && dto.giftCardRedemption) {
        const redeemed = await this.giftCardsService.redeemInTx(tx, dto.giftCardRedemption);
        giftCardAmount = redeemed.redeemedAmount;
      }

      if (!isQuote && dto.loyaltyRedemption && dto.customerId) {
        const redeemed = await this.loyaltyService.redeemPointsInTx(
          tx,
          dto.customerId,
          dto.loyaltyRedemption.points,
          `Checkout ${dto.id}`,
        );
        loyaltyAmount = redeemed.redeemValue;
      }

      const amountDue = Math.round((pricedTotal - giftCardAmount - loyaltyAmount) * 100) / 100;

      // --- A. FINANCE BOUNDARY ---
      const hasSplitPayments = !isQuote && dto.payments && dto.payments.length > 0;
      const deferFinance = dto.status === 'PENDING_PAYMENT';

      if (!isQuote && !hasSplitPayments && !deferFinance && amountDue > 0.01) {
        if (dto.paymentMethod === 'CUSTOMER_CREDIT') {
          if (!dto.customerId) throw new BadRequestException('Customer ID required for credit');
          await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
            customerId: dto.customerId,
            amount: amountDue,
            orderId: dto.id,
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
              amountDue,
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
          cartDiscountTotal: Math.round((cartEvaluation.discountTotal + manualCartDiscount) * 100) / 100,
          grandTotal: pricedTotal,
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
              finalPrice: l.finalPrice,
              historicalSku: l.historicalSku,
              historicalName: l.historicalName,
              historicalCost: l.historicalCost,
            }))
          }
        },
        include: { lines: true }
      });

      if (hasSplitPayments && !deferFinance) {
        await this.processPaymentSplits(tx, dto, order.id, amountDue);
      } else if (!isQuote) {
        if (giftCardAmount > 0) {
          await this.recordRedemptionPayment(tx, order.id, 'GIFT_CARD', giftCardAmount, dto.giftCardRedemption?.code);
        }
        if (loyaltyAmount > 0) {
          await this.recordRedemptionPayment(
            tx,
            order.id,
            'LOYALTY',
            loyaltyAmount,
            dto.loyaltyRedemption ? String(dto.loyaltyRedemption.points) : undefined,
          );
        }
        if (amountDue > 0.01) {
          const pmType =
            dto.paymentMethod === 'QR_MERCADOPAGO'
              ? 'CREDIT_CARD'
              : dto.paymentMethod === 'CUSTOMER_CREDIT'
                ? 'CUSTOMER_CREDIT'
                : dto.paymentMethod;
          const pm = await this.ensurePaymentMethod(tx, pmType);
          if (pm) {
            await tx.saleOrderPayment.create({
              data: {
                orderId: order.id,
                paymentMethodId: pm.id,
                amount: amountDue,
                referenceId: dto.paymentReference || null,
              },
            });
          }
        }
      }

      // --- D. DATA INTEGRITY BOUNDARY (Price Variance) ---
      if (Math.abs(posDifference) > 0.01) {
        await tx.saleOrderVariance.create({
          data: {
            orderId: order.id,
            posTotal: dto.posGrandTotal ?? expectedAmountDue,
            serverTotal: pricedTotal,
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

      return { status: 'SUCCESS', order, giftCardAmount, loyaltyAmount };
    });

    // 5. ASYNC EXTERNAL BOUNDARY — Fire and Forget
    // Enqueues AFIP invoice generation AFTER the DB transaction has committed.
    if (result.order.issueInvoice && result.order.status !== 'PENDING_PAYMENT') {
      await this.afipProducer.enqueueInvoiceGeneration(result.order.id, dto.branchId);
    }

    if (result.status === 'SUCCESS' && result.order && !isQuote) {
      const completedStatuses = ['COMPLETED', 'CONFIRMED'];
      if (completedStatuses.includes(result.order.status)) {
        void this.notificationTriggers.onSaleCompleted(result.order.id);
        if (dto.customerId) {
          const earnBase = pricedTotal - (result.loyaltyAmount ?? 0);
          void this.loyaltyService.earnPointsForOrder(dto.customerId, earnBase, result.order.id);
        }
      }
      if (dto.warehouseId && result.order.status !== 'PENDING_PAYMENT') {
        for (const line of result.order.lines) {
          void this.notificationTriggers.checkLowStock(line.variantId, dto.warehouseId, dto.branchId);
        }
      }
    }

    return result;
  }

  /**
   * Update an existing quotation / draft. Reprices lines and replaces them atomically.
   * No stock or finance side-effects (quotes never reserve inventory).
   */
  async updateQuotation(id: string, dto: UpdateQuotationDto) {
    const existing = await this.prisma.saleOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Presupuesto no encontrado');
    if (existing.status !== 'QUOTATION' && existing.status !== 'QUOTE') {
      throw new BadRequestException('Solo se pueden editar presupuestos o borradores');
    }
    if (!dto.lines?.length) {
      throw new BadRequestException('El presupuesto debe tener al menos un artículo');
    }

    const pricingSettings = await this.settingsService.getPricingSettings();
    const customerId =
      dto.customerId === undefined ? existing.customerId : (dto.customerId || null);

    const evaluatedLines = [];
    for (const lineDto of dto.lines) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: lineDto.variantId },
        include: { product: true },
      });
      if (!variant) throw new BadRequestException(`Variant ${lineDto.variantId} not found`);

      let resolvedBasePrice: number;
      if (lineDto.unitPriceOverride !== undefined) {
        resolvedBasePrice = lineDto.unitPriceOverride;
      } else {
        resolvedBasePrice = await this.pricingService.resolvePrice(
          lineDto.variantId,
          variant.basePrice,
          customerId || undefined,
        );
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
      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: this.resolveLineCategoryId(lineDto.categoryId, variant.product?.categoryId),
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        manualDiscountAmount,
        historicalSku: variant.sku,
        historicalName: variant.product?.name || null,
        historicalCost: variant.costPrice ?? null,
      });
    }

    const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
      id: crypto.randomUUID(),
      variantId: l.variantId,
      categoryId: l.categoryId,
      quantity: l.quantity,
      unitPrice: l.basePrice - (l.manualDiscountAmount),
    })));

    const finalLinesForDB = evaluatedLines.map((line, index) => {
      const promotionalDiscount = cartEvaluation.lines[index].promotionalDiscount;
      const totalDiscountAmount = line.manualDiscountAmount + promotionalDiscount;
      return {
        ...line,
        totalDiscountAmount,
        finalPrice: line.basePrice - (totalDiscountAmount / line.quantity),
      };
    });

    const merchandiseTotal = cartEvaluation.finalTotal;
    let manualCartDiscount = 0;
    let pricedTotal = merchandiseTotal;
    try {
      const discounted = applyManualCartDiscount({
        merchandiseTotal,
        cartDiscountTotal: dto.cartDiscountTotal ?? 0,
        allowManualDiscount: pricingSettings.allowManualDiscount,
        maxDiscountPct: pricingSettings.maxDiscountPct,
      });
      manualCartDiscount = discounted.manualCartDiscount;
      pricedTotal = discounted.pricedTotal;
    } catch (err: any) {
      const code = err?.message;
      if (code === 'MANUAL_DISCOUNT_DISABLED') {
        throw new BadRequestException('Los descuentos manuales están deshabilitados por configuración del sistema.');
      }
      if (code === 'CART_DISCOUNT_EXCEEDS_TOTAL') {
        throw new BadRequestException('El descuento global supera el total de la venta');
      }
      if (code === 'CART_DISCOUNT_EXCEEDS_MAX_PCT') {
        throw new BadRequestException(
          `El descuento global excede el máximo permitido del ${pricingSettings.maxDiscountPct}%`,
        );
      }
      throw err;
    }

    if (dto.posGrandTotal !== undefined && Math.abs(dto.posGrandTotal - pricedTotal) > 0.01) {
      throw new BadRequestException(
        `Payment mismatch. Expected ${pricedTotal} after redemptions, got ${dto.posGrandTotal}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.orderLineItem.deleteMany({ where: { orderId: id } });

      return tx.saleOrder.update({
        where: { id },
        data: {
          status: 'QUOTATION',
          warehouseId: dto.warehouseId !== undefined ? dto.warehouseId : existing.warehouseId,
          customerId,
          paymentMethod: dto.paymentMethod ?? existing.paymentMethod,
          subtotal: cartEvaluation.originalTotal,
          cartDiscountTotal: Math.round((cartEvaluation.discountTotal + manualCartDiscount) * 100) / 100,
          grandTotal: pricedTotal,
          appliedPromotions: cartEvaluation.appliedPromotions,
          lines: {
            create: finalLinesForDB.map(l => ({
              variantId: l.variantId,
              categoryId: l.categoryId,
              quantity: l.quantity,
              basePrice: l.basePrice,
              discountAmount: l.totalDiscountAmount,
              finalPrice: l.finalPrice,
              historicalSku: l.historicalSku,
              historicalName: l.historicalName,
              historicalCost: l.historicalCost,
            })),
          },
        },
        include: { lines: true, customer: true },
      });
    });
  }

  async confirmQuotation(id: string) {
    const quote = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: { lines: true, payments: { include: { paymentMethod: true } } },
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

    const updated = await this.prisma.$transaction(async (tx) => {
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

      // 2. POST FINANCE (cuenta corriente / tesorería) — quotes skip this at creation
      await this.postOrderFinanceIfNeeded(tx, quote);

      // 3. UPDATE STATUS
      const updatedOrder = await tx.saleOrder.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { lines: true }
      });

      // 4. EVENT BOUNDARY (Outbox Pattern)
      await tx.outboxEvent.create({
        data: {
          aggregate: 'SaleOrder',
          aggregateId: updatedOrder.id,
          type: 'ORDER_CONFIRMED',
          payload: { orderId: updatedOrder.id, branchId: updatedOrder.branchId, status: 'CONFIRMED', grandTotal: updatedOrder.grandTotal }
        }
      });

      return updatedOrder;
    });

    if (updated.issueInvoice) {
      await this.afipProducer.enqueueInvoiceGeneration(updated.id, updated.branchId);
    }

    void this.notificationTriggers.onSaleCompleted(updated.id);
    if (quote.customerId) {
      void this.loyaltyService.earnPointsForOrder(quote.customerId, updated.grandTotal, updated.id);
    }
    for (const line of updated.lines) {
      void this.notificationTriggers.checkLowStock(line.variantId, targetWarehouseId, quote.branchId);
    }
    return updated;
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

    return expandComboToStockMovements(variantWithProduct, variantId, quantity);
  }

  async confirmPayment(id: string, paymentReference?: string) {
    const order = await this.prisma.saleOrder.findUnique({
      where: { id },
      include: { lines: true, payments: { include: { paymentMethod: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException('Solo se pueden validar ventas con pago pendiente');
    }

    let targetWarehouseId = order.warehouseId;
    if (!targetWarehouseId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: order.branchId },
        include: { warehouses: true },
      });
      if (branch?.warehouses.length) targetWarehouseId = branch.warehouses[0].id;
    }

    const newStatus =
      order.source === 'ECOMMERCE' || order.source === 'BACKOFFICE' ? 'CONFIRMED' : 'COMPLETED';

    const updated = await this.prisma.$transaction(async (tx) => {
      if (targetWarehouseId) {
        for (const line of order.lines) {
          await this.inventoryService.consumeReservation(
            line.variantId,
            targetWarehouseId,
            order.branchId,
            line.quantity,
            order.id,
            tx,
          );
        }
      }

      if (paymentReference) {
        await this.savePaymentReference(tx, order, paymentReference);
      }

      await this.postOrderFinanceIfNeeded(tx, order, paymentReference);

      const updatedOrder = await tx.saleOrder.update({
        where: { id },
        data: { status: newStatus },
        include: { lines: true, payments: { include: { paymentMethod: true } } },
      });

      await tx.outboxEvent.create({
        data: {
          aggregate: 'SaleOrder',
          aggregateId: updatedOrder.id,
          type: 'ORDER_CONFIRMED',
          payload: {
            orderId: updatedOrder.id,
            branchId: updatedOrder.branchId,
            status: newStatus,
            grandTotal: updatedOrder.grandTotal,
          },
        },
      });

      return updatedOrder;
    });

    if (updated.issueInvoice) {
      await this.afipProducer.enqueueInvoiceGeneration(updated.id, updated.branchId);
    }

    void this.notificationTriggers.onSaleCompleted(updated.id);
    if (order.customerId) {
      void this.loyaltyService.earnPointsForOrder(order.customerId, updated.grandTotal, updated.id);
    }
    if (targetWarehouseId) {
      for (const line of updated.lines) {
        void this.notificationTriggers.checkLowStock(line.variantId, targetWarehouseId, order.branchId);
      }
    }

    return updated;
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

    if (order.status === 'QUOTATION' || order.status === 'QUOTE') {
      return this.prisma.saleOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { lines: true },
      });
    }

    if (order.status === 'PENDING_PAYMENT') {
      return this.prisma.$transaction(async (tx) => {
        if (order.warehouseId) {
          for (const line of order.lines) {
            await this.inventoryService.releaseReservation(
              line.variantId,
              order.warehouseId,
              order.branchId,
              line.quantity,
              order.id,
              tx,
            );
          }
        }

        await this.reverseOrderFinance(tx, order);

        return tx.saleOrder.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { lines: true },
        });
      });
    }

    if (!['COMPLETED', 'CONFIRMED', 'READY_FOR_PICKUP', 'DELIVERED'].includes(order.status)) {
      throw new BadRequestException('No se puede cancelar este documento en su estado actual');
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

      await this.reverseOrderFinance(tx, order);

      return tx.saleOrder.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { lines: true },
      });
    });
  }

  private async savePaymentReference(tx: any, order: any, paymentReference: string) {
    const existingPayment = await tx.saleOrderPayment.findFirst({
      where: { orderId: order.id },
    });

    if (existingPayment) {
      await tx.saleOrderPayment.update({
        where: { id: existingPayment.id },
        data: { referenceId: paymentReference },
      });
      return;
    }

    const treasuryMethod =
      order.paymentMethod === 'QR_MERCADOPAGO' ? 'QR_MERCADOPAGO' : order.paymentMethod;
    const pm = await tx.paymentMethod.findFirst({
      where: { type: treasuryMethod, isActive: true },
    });

    if (pm) {
      await tx.saleOrderPayment.create({
        data: {
          orderId: order.id,
          paymentMethodId: pm.id,
          amount: order.grandTotal,
          referenceId: paymentReference,
        },
      });
    }
  }

  private async postOrderFinanceIfNeeded(tx: any, order: any, paymentReference?: string) {
    const refNote = paymentReference ? ` Ref: ${paymentReference}` : '';

    if (order.payments?.length > 0) {
      for (const payment of order.payments) {
        const methodType = payment.paymentMethod.type;
        if (methodType === 'CUSTOMER_CREDIT') {
          if (!order.customerId) throw new BadRequestException('Customer ID required for credit');
          await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
            customerId: order.customerId,
            amount: payment.amount,
            orderId: order.id,
          });
        } else if (payment.paymentMethod.accountId) {
          const alreadyPosted = await tx.financialTransaction.count({
            where: {
              referenceId: order.id,
              type: 'DEBIT',
              accountId: payment.paymentMethod.accountId,
            },
          });
          if (alreadyPosted > 0) continue;
          await this.postSaleLedgerEntry(
            tx,
            payment.paymentMethod.accountId,
            payment.amount,
            order.id,
            `Pago confirmado via ${methodType}${refNote}`,
            order.customerId || 'Walk-in',
          );
        }
      }
      return;
    }

    if (order.paymentMethod === 'CUSTOMER_CREDIT') {
      if (!order.customerId) throw new BadRequestException('Customer ID required for credit');
      await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
        customerId: order.customerId,
        amount: order.grandTotal,
        orderId: order.id,
      });
      return;
    }

    const existingTreasury = await tx.financialTransaction.count({
      where: { referenceId: order.id, type: 'DEBIT' },
    });
    if (existingTreasury > 0) return;

    const treasuryMethod =
      order.paymentMethod === 'QR_MERCADOPAGO' ? 'QR_MERCADOPAGO' : order.paymentMethod;
    const pm = await tx.paymentMethod.findFirst({
      where: { type: treasuryMethod, isActive: true },
    });
    if (pm?.accountId) {
      await this.postSaleLedgerEntry(
        tx,
        pm.accountId,
        order.grandTotal,
        order.id,
        `Pago confirmado via ${treasuryMethod}${refNote}`,
        order.customerId || 'Walk-in',
      );
    }
  }

  private async reverseOrderFinance(tx: any, order: any) {
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

    let creditReversed = false;
    if (order.paymentMethod === 'CUSTOMER_CREDIT' && order.customerId) {
      await this.currentAccountsService.reverseCustomerSaleInTx(tx, {
        customerId: order.customerId,
        amount: order.grandTotal,
        orderId: order.id,
      });
      creditReversed = true;
    }

    if (!creditReversed && order.customerId) {
      const creditPayments = (order.payments || []).filter(
        (p: { paymentMethod?: { type?: string }; amount: number }) =>
          p.paymentMethod?.type === 'CUSTOMER_CREDIT',
      );
      const creditTotal = creditPayments.reduce(
        (sum: number, p: { amount: number }) => sum + p.amount,
        0,
      );
      if (creditTotal > 0.01) {
        await this.currentAccountsService.reverseCustomerSaleInTx(tx, {
          customerId: order.customerId,
          amount: creditTotal,
          orderId: order.id,
        });
      }
    }
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
        await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
          customerId: dto.customerId,
          amount: split.amount,
          orderId,
        });
        const pm = await this.ensurePaymentMethod(tx, 'CUSTOMER_CREDIT');
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
      } else if (methodType === 'GIFT_CARD' || methodType === 'LOYALTY') {
        // Redemptions are processed before splits; skip duplicate ledger entries
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

  /**
   * Ignore legacy POS placeholders ("default" / "default_category") so category
   * promotions resolve from the variant's real product category.
   */
  private resolveLineCategoryId(dtoCategoryId?: string, productCategoryId?: string | null): string {
    const fake = !dtoCategoryId
      || dtoCategoryId === 'default'
      || dtoCategoryId === 'default_category';
    return (!fake ? dtoCategoryId : undefined)
      || productCategoryId
      || 'default_category';
  }

  /** Ensures a PaymentMethod row exists (e.g. CUSTOMER_CREDIT is not always seeded). */
  private async ensurePaymentMethod(tx: any, type: string) {
    let pm = await tx.paymentMethod.findFirst({ where: { type, isActive: true } });
    if (pm) return pm;
    if (type !== 'CUSTOMER_CREDIT') return null;
    pm = await tx.paymentMethod.create({
      data: {
        name: 'Cuenta Corriente',
        type: 'CUSTOMER_CREDIT',
        isActive: true,
      },
    });
    return pm;
  }

  private async recordRedemptionPayment(
    tx: any,
    orderId: string,
    type: string,
    amount: number,
    reference?: string,
  ) {
    const pm = await tx.paymentMethod.findFirst({ where: { type, isActive: true } });
    if (!pm) return;
    await tx.saleOrderPayment.create({
      data: {
        orderId,
        paymentMethodId: pm.id,
        amount,
        referenceId: reference || null,
      },
    });
  }
}
