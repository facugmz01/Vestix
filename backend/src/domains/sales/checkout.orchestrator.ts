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
import { AuthService } from '../identity/auth.service';
import { AuditService } from '../../modules/audit/audit.service';
import { RbacService } from '../../core/rbac/rbac.service';
import { roleHasPermissions } from '../../core/rbac/permission-match.util';
import * as crypto from 'crypto';

export function normalizePaymentMethodType(raw?: string | null): string {
  if (!raw) return 'CASH';
  const u = String(raw).trim().toUpperCase();
  if (['EFECTIVO', 'CASH', 'CONTADO', 'DINERO'].includes(u)) return 'CASH';
  if (['TRANSFERENCIA', 'TRANSFER', 'BANK_TRANSFER', 'DEPOSITO', 'DEPOSIT', 'BANCO'].includes(u)) return 'BANK_TRANSFER';
  if (['TARJETA', 'DEBIT_CARD', 'CREDIT_CARD', 'CARD', 'QR_MERCADOPAGO', 'MERCADOPAGO', 'MP', 'MERCADO_PAGO'].includes(u)) return 'CREDIT_CARD';
  if (['CUENTA_CORRIENTE', 'CUSTOMER_CREDIT', 'STORE_CREDIT', 'CREDITO', 'CREDIT'].includes(u)) return 'CUSTOMER_CREDIT';
  if (u === 'GIFT_CARD') return 'GIFT_CARD';
  if (u === 'LOYALTY') return 'LOYALTY';
  return u;
}

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
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly rbacService: RbacService,
  ) {}

  private async userHasPermission(userId: string | undefined, action: string, subject: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } },
    });
    if (!user || !user.role) return false;
    if (user.role.name === 'SUPER_ADMIN') return true;
    return roleHasPermissions(user.role.permissions || [], [{ action, subject }]);
  }

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

    // Load Pricing & Invoicing Settings (from shared cache — no extra DB query)
    const [pricingSettings, invoicingSettings] = await Promise.all([
      this.settingsService.getPricingSettings(),
      this.settingsService.getInvoicingSettings(),
    ]);

    const shouldEmitInvoice = !isQuote && (
      dto.emitInvoice !== undefined
        ? Boolean(dto.emitInvoice)
        : dto.issueInvoice !== undefined
          ? Boolean(dto.issueInvoice)
          : Boolean(invoicingSettings?.autoIssueOnSale)
    );

    // 2. PRICING EVALUATION (Server-Authoritative with RBAC / Supervisor validation)
    const evaluatedLines = [];
    let hasAnyPriceOverrideOrDiscount = false;

    for (const lineDto of dto.lines) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: lineDto.variantId },
        include: { product: true },
      });
      if (!variant) throw new BadRequestException(`Variant ${lineDto.variantId} not found`);

      const catalogResolvedPrice = await this.pricingService.resolvePrice(lineDto.variantId, variant.basePrice, dto.customerId);

      // --- Price Override Validation ---
      const rawCustomPrice = lineDto.customUnitPrice !== undefined ? lineDto.customUnitPrice : lineDto.unitPriceOverride;
      const isPriceOverridden = rawCustomPrice !== undefined && Math.abs(rawCustomPrice - catalogResolvedPrice) > 0.01;
      
      let resolvedBasePrice = catalogResolvedPrice;
      let priceOverrideAuthorizedBy: string | null = null;

      if (isPriceOverridden && rawCustomPrice !== undefined) {
        hasAnyPriceOverrideOrDiscount = true;
        let isAllowed = await this.userHasPermission(cashierUserId, 'override', 'Price');
        if (!isAllowed) {
          const token = lineDto.supervisorApprovalToken || dto.supervisorApprovalToken;
          if (token) {
            const approval = this.authService.verifyApprovalToken(token, 'override:Price');
            priceOverrideAuthorizedBy = approval.supervisorId;
            isAllowed = true;
          }
        } else {
          priceOverrideAuthorizedBy = cashierUserId || null;
        }

        if (!isAllowed) {
          throw new BadRequestException(
            `No tienes permiso para modificar el precio unitario del producto ${variant.sku || variant.product?.name}. Se requiere autorización de supervisor.`
          );
        }
        resolvedBasePrice = Math.max(0, rawCustomPrice);
      }

      // --- Line Discount Validation & Calculation ---
      let manualDiscountAmount = 0;
      let lineDiscountAuthorizedBy: string | null = null;
      const hasLineDiscount = (lineDto.discountType && lineDto.discountValue !== undefined && lineDto.discountValue > 0) ||
                              (lineDto.discountPct !== undefined && lineDto.discountPct > 0);

      if (hasLineDiscount) {
        hasAnyPriceOverrideOrDiscount = true;
        let isAllowed = await this.userHasPermission(cashierUserId, 'apply', 'Discount');
        if (!isAllowed) {
          const token = lineDto.supervisorApprovalToken || dto.supervisorApprovalToken;
          if (token) {
            const approval = this.authService.verifyApprovalToken(token, 'apply:Discount');
            lineDiscountAuthorizedBy = approval.supervisorId;
            isAllowed = true;
          }
        } else {
          lineDiscountAuthorizedBy = cashierUserId || null;
        }

        if (!isAllowed) {
          throw new BadRequestException(
            `No tienes permiso para aplicar descuentos en la línea de ${variant.sku || variant.product?.name}. Se requiere autorización de supervisor.`
          );
        }

        if (lineDto.discountType === 'FIXED') {
          const maxLineTotal = resolvedBasePrice * lineDto.quantity;
          manualDiscountAmount = Math.min(lineDto.discountValue!, maxLineTotal);
        } else {
          // PERCENTAGE or legacy discountPct
          const pct = lineDto.discountType === 'PERCENTAGE' ? (lineDto.discountValue || 0) : (lineDto.discountPct || 0);
          if (pct > 0) {
            if (pricingSettings.allowManualDiscount === false && !lineDiscountAuthorizedBy) {
              throw new BadRequestException('Los descuentos manuales están deshabilitados por configuración del sistema.');
            }
            if (pricingSettings.maxDiscountPct && pct > pricingSettings.maxDiscountPct && !lineDiscountAuthorizedBy) {
              throw new BadRequestException(`El descuento manual excede el máximo permitido del ${pricingSettings.maxDiscountPct}%`);
            }
            manualDiscountAmount = (resolvedBasePrice * lineDto.quantity) * (pct / 100);
          }
        }
      }

      const lineTotalAfterDiscount = (resolvedBasePrice * lineDto.quantity) - manualDiscountAmount;
      const finalPriceAfterManualDiscount = lineDto.quantity > 0 ? lineTotalAfterDiscount / lineDto.quantity : resolvedBasePrice;
      const resolvedCategoryId = this.resolveLineCategoryId(lineDto.categoryId, variant.product?.categoryId);

      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: resolvedCategoryId,
        quantity: lineDto.quantity,
        catalogResolvedPrice,
        basePrice: resolvedBasePrice,
        manualDiscountAmount: Math.round(manualDiscountAmount * 100) / 100,
        finalPrice: finalPriceAfterManualDiscount,
        historicalSku: variant.sku,
        historicalName: variant.product?.name || null,
        historicalCost: variant.costPrice ?? null,
        priceOverrideAuthorizedBy,
        lineDiscountAuthorizedBy,
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

    // --- Global Cart Discount Validation & Calculation ---
    let globalDiscountAuthorizedBy: string | null = null;
    const hasGlobalDiscount = (dto.globalDiscountType && dto.globalDiscountValue !== undefined && dto.globalDiscountValue > 0) ||
                              (dto.cartDiscountTotal !== undefined && dto.cartDiscountTotal > 0);

    if (hasGlobalDiscount) {
      hasAnyPriceOverrideOrDiscount = true;
      let isAllowed = await this.userHasPermission(cashierUserId, 'apply', 'Discount');
      if (!isAllowed) {
        const token = dto.supervisorApprovalToken;
        if (token) {
          const approval = this.authService.verifyApprovalToken(token, 'apply:Discount');
          globalDiscountAuthorizedBy = approval.supervisorId;
          isAllowed = true;
        }
      } else {
        globalDiscountAuthorizedBy = cashierUserId || null;
      }

      if (!isAllowed) {
        throw new BadRequestException('No tienes permiso para aplicar descuento general a la venta. Se requiere autorización de supervisor.');
      }
    }

    let manualCartDiscount = 0;
    let pricedTotal = merchandiseTotal;
    try {
      const discounted = applyManualCartDiscount({
        merchandiseTotal,
        cartDiscountTotal: dto.cartDiscountTotal,
        globalDiscountType: dto.globalDiscountType,
        globalDiscountValue: dto.globalDiscountValue,
        allowManualDiscount: pricingSettings.allowManualDiscount,
        maxDiscountPct: pricingSettings.maxDiscountPct,
        hasSupervisorOverride: Boolean(globalDiscountAuthorizedBy),
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

      // --- A. INVENTORY BOUNDARY ---
      if (!isQuote && dto.warehouseId) {
        if (dto.status === 'PENDING_PAYMENT') {
          for (const line of finalLinesForDB) {
            const movements = await this.resolveStockMovements(line.variantId, line.quantity, tx);
            for (const movement of movements) {
              await this.inventoryService.reserveStock(
                movement.variantId,
                dto.warehouseId,
                dto.branchId,
                movement.quantity,
                dto.id,
                tx
              );
            }
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

      // If customer fiscal data is provided, sync it with the customer profile
      if (dto.fiscalCustomerData && dto.customerId) {
        await tx.customer.update({
          where: { id: dto.customerId },
          data: {
            taxId: dto.fiscalCustomerData.taxId || undefined,
            fullName: dto.fiscalCustomerData.businessName || undefined,
            taxCondition: dto.fiscalCustomerData.taxCondition || undefined,
          },
        });
      }

      // --- B. SALES BOUNDARY (Create SaleOrder Header & Lines) ---
      const hasSplitPayments = !isQuote && dto.payments && dto.payments.length > 0;
      const deferFinance = dto.status === 'PENDING_PAYMENT';

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
          cashShiftId: dto.cashShiftId || null,
          issueInvoice: shouldEmitInvoice,
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

      // --- C. ATOMIC FINANCE BOUNDARY ---
      let resolvedPrimaryAccountId: string | null = null;

      if (!isQuote && !deferFinance) {
        if (hasSplitPayments) {
          await this.processPaymentSplits(tx, dto, order.id, amountDue);
        } else if (amountDue > 0.01) {
          const normMethod = normalizePaymentMethodType(dto.paymentMethod);
          if (normMethod === 'CUSTOMER_CREDIT') {
            if (!dto.customerId) throw new BadRequestException('Customer ID required for credit');
            await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
              customerId: dto.customerId,
              amount: amountDue,
              orderId: order.id,
            });
            const pm = await this.ensurePaymentMethod(tx, 'CUSTOMER_CREDIT');
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
          } else {
            const accountId = await this.accountsService.resolvePaymentAccountInTx(
              tx,
              dto.branchId,
              normMethod,
              dto.cashShiftId,
              dto.paymentAccountId,
            );
            resolvedPrimaryAccountId = accountId;

            const refNote = dto.paymentReference ? ` Ref: ${dto.paymentReference}` : '';
            const description = `Cobro Venta #${order.id.slice(0, 8)} via ${dto.paymentMethod || normMethod}${refNote}`;
            await this.postSaleLedgerEntry(
              tx,
              accountId,
              amountDue,
              order.id,
              description,
              dto.customerId || 'Walk-in',
            );

            const pm = await this.ensurePaymentMethod(tx, normMethod, accountId);
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

            await tx.saleOrder.update({
              where: { id: order.id },
              data: { financialAccountId: accountId },
            });
          }
        }

        // Redemptions (Gift cards / Loyalty)
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
      }

      // If fiscal invoice is explicitly requested with a specific invoiceType, create the initial draft
      if (shouldEmitInvoice && dto.invoiceType) {
        const netAmount = Math.round((pricedTotal / 1.21) * 100) / 100;
        const vatAmount = Math.round((pricedTotal - netAmount) * 100) / 100;
        await tx.invoice.create({
          data: {
            id: crypto.randomUUID(),
            orderId: order.id,
            type: dto.invoiceType,
            customerDocumentType: dto.fiscalCustomerData?.docType || (dto.fiscalCustomerData?.taxId?.length === 11 ? 'CUIT' : 'DNI'),
            customerDocumentNumber: dto.fiscalCustomerData?.taxId || '0',
            netAmount,
            vatAmount,
            totalAmount: pricedTotal,
            status: 'PENDING_AFIP',
          },
        });
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
          const movements = await this.resolveStockMovements(line.variantId, line.quantity);
          for (const movement of movements) {
            void this.notificationTriggers.checkLowStock(movement.variantId, dto.warehouseId, dto.branchId);
          }
        }
      }
    }

    if (result.status === 'SUCCESS' && result.order && hasAnyPriceOverrideOrDiscount) {
      void this.auditService.log({
        userId: cashierUserId || 'system',
        action: 'UPDATE',
        module: 'Sales',
        resource: 'SaleOrder',
        resourceId: result.order.id,
        newValue: {
          orderId: result.order.id,
          globalDiscount: manualCartDiscount,
          globalDiscountType: dto.globalDiscountType,
          globalDiscountValue: dto.globalDiscountValue,
          globalAuthorizedBy: globalDiscountAuthorizedBy,
          lines: evaluatedLines.map(l => ({
            variantId: l.variantId,
            sku: l.historicalSku,
            originalPrice: l.catalogResolvedPrice,
            appliedBasePrice: l.basePrice,
            discountAmount: l.manualDiscountAmount,
            priceOverrideAuthorizedBy: l.priceOverrideAuthorizedBy,
            lineDiscountAuthorizedBy: l.lineDiscountAuthorizedBy,
          })),
        },
        description: `Descuentos o modificación de precio en Venta #${result.order.id.slice(0, 8)}`,
      }).catch(() => {});
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
      const rawCustomPrice = lineDto.customUnitPrice !== undefined ? lineDto.customUnitPrice : lineDto.unitPriceOverride;
      if (rawCustomPrice !== undefined) {
        resolvedBasePrice = Math.max(0, rawCustomPrice);
      } else {
        resolvedBasePrice = await this.pricingService.resolvePrice(
          lineDto.variantId,
          variant.basePrice,
          customerId || undefined,
        );
      }

      let manualDiscountAmount = 0;
      if (lineDto.discountType === 'FIXED') {
        const maxLineTotal = resolvedBasePrice * lineDto.quantity;
        manualDiscountAmount = Math.min(lineDto.discountValue || 0, maxLineTotal);
      } else {
        const manualDiscountPct = lineDto.discountType === 'PERCENTAGE' ? (lineDto.discountValue || 0) : (lineDto.discountPct || 0);
        if (manualDiscountPct > 0) {
          if (pricingSettings.allowManualDiscount === false) {
            throw new BadRequestException('Los descuentos manuales están deshabilitados por configuración del sistema.');
          }
          if (pricingSettings.maxDiscountPct && manualDiscountPct > pricingSettings.maxDiscountPct) {
            throw new BadRequestException(`El descuento manual excede el máximo permitido del ${pricingSettings.maxDiscountPct}%`);
          }
          manualDiscountAmount = (resolvedBasePrice * lineDto.quantity) * (manualDiscountPct / 100);
        }
      }

      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: this.resolveLineCategoryId(lineDto.categoryId, variant.product?.categoryId),
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        manualDiscountAmount: Math.round(manualDiscountAmount * 100) / 100,
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
      unitPrice: l.basePrice - (l.manualDiscountAmount / l.quantity),
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
        globalDiscountType: dto.globalDiscountType,
        globalDiscountValue: dto.globalDiscountValue,
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
      const movements = await this.resolveStockMovements(line.variantId, line.quantity);
      for (const movement of movements) {
        void this.notificationTriggers.checkLowStock(movement.variantId, targetWarehouseId, quote.branchId);
      }
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
          const movements = await this.resolveStockMovements(line.variantId, line.quantity, tx);
          for (const movement of movements) {
            await this.inventoryService.consumeReservation(
              movement.variantId,
              targetWarehouseId,
              order.branchId,
              movement.quantity,
              order.id,
              tx,
            );
          }
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
        const movements = await this.resolveStockMovements(line.variantId, line.quantity);
        for (const movement of movements) {
          void this.notificationTriggers.checkLowStock(movement.variantId, targetWarehouseId, order.branchId);
        }
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
            const movements = await this.resolveStockMovements(line.variantId, line.quantity, tx);
            for (const movement of movements) {
              await this.inventoryService.releaseReservation(
                movement.variantId,
                order.warehouseId,
                order.branchId,
                movement.quantity,
                order.id,
                tx,
              );
            }
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
        const methodType = normalizePaymentMethodType(payment.paymentMethod?.type || order.paymentMethod);
        if (methodType === 'CUSTOMER_CREDIT') {
          if (!order.customerId) throw new BadRequestException('Customer ID required for credit');
          const alreadyCharged = await tx.currentAccountMovement.count({
            where: { referenceId: order.id, entityType: 'CUSTOMER' },
          });
          if (alreadyCharged === 0) {
            await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
              customerId: order.customerId,
              amount: payment.amount,
              orderId: order.id,
            });
          }
        } else if (methodType !== 'GIFT_CARD' && methodType !== 'LOYALTY') {
          const accountId =
            payment.paymentMethod?.accountId ||
            await this.accountsService.resolvePaymentAccountInTx(
              tx,
              order.branchId,
              methodType,
              order.cashShiftId,
              order.paymentAccountId,
            );

          const alreadyPosted = await tx.financialTransaction.count({
            where: {
              referenceId: order.id,
              type: 'DEBIT',
              accountId,
            },
          });
          if (alreadyPosted > 0) continue;

          await this.postSaleLedgerEntry(
            tx,
            accountId,
            payment.amount,
            order.id,
            `Pago confirmado via ${methodType}${refNote}`,
            order.customerId || 'Walk-in',
          );
        }
      }
      return;
    }

    const normMethod = normalizePaymentMethodType(order.paymentMethod);
    if (normMethod === 'CUSTOMER_CREDIT') {
      if (!order.customerId) throw new BadRequestException('Customer ID required for credit');
      const alreadyCharged = await tx.currentAccountMovement.count({
        where: { referenceId: order.id, entityType: 'CUSTOMER' },
      });
      if (alreadyCharged === 0) {
        await this.currentAccountsService.chargeCustomerSaleInTx(tx, {
          customerId: order.customerId,
          amount: order.grandTotal,
          orderId: order.id,
        });
      }
      return;
    }

    const accountId = await this.accountsService.resolvePaymentAccountInTx(
      tx,
      order.branchId,
      normMethod,
      order.cashShiftId,
      order.paymentAccountId,
    );

    const existingTreasury = await tx.financialTransaction.count({
      where: { referenceId: order.id, type: 'DEBIT', accountId },
    });
    if (existingTreasury > 0) return;

    await this.postSaleLedgerEntry(
      tx,
      accountId,
      order.grandTotal,
      order.id,
      `Pago confirmado via ${normMethod}${refNote}`,
      order.customerId || 'Walk-in',
    );

    await tx.saleOrder.update({
      where: { id: order.id },
      data: { financialAccountId: accountId },
    });
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
          normalizePaymentMethodType(p.paymentMethod?.type) === 'CUSTOMER_CREDIT',
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
    const norm = normalizePaymentMethodType(methodType);
    return this.accountsService.resolvePaymentAccountInTx(
      tx,
      dto.branchId,
      norm,
      dto.cashShiftId,
      dto.paymentAccountId,
    );
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

    let primaryAccountId: string | null = null;

    for (const split of splits) {
      if (split.amount <= 0.01) continue;
      const methodType = normalizePaymentMethodType(split.method);

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
        // Redemptions are processed separately; skip duplicate ledger entries
      } else {
        const accountId = await this.accountsService.resolvePaymentAccountInTx(
          tx,
          dto.branchId,
          methodType,
          dto.cashShiftId,
          dto.paymentAccountId,
        );
        if (!primaryAccountId) primaryAccountId = accountId;

        const description = `Cobro Venta #${orderId.slice(0, 8)} via ${split.method}${split.reference ? ` Ref: ${split.reference}` : ''}`;
        await this.postSaleLedgerEntry(
          tx,
          accountId,
          split.amount,
          orderId,
          description,
          dto.customerId || 'Walk-in',
        );

        const pm = await this.ensurePaymentMethod(tx, methodType, accountId);
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

    if (primaryAccountId) {
      await tx.saleOrder.update({
        where: { id: orderId },
        data: { financialAccountId: primaryAccountId },
      });
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

  /** Ensures a PaymentMethod row exists and is linked to the specified account. */
  private async ensurePaymentMethod(tx: any, type: string, accountId?: string) {
    const norm = normalizePaymentMethodType(type);
    let pm = await tx.paymentMethod.findFirst({
      where: {
        type: norm,
        isActive: true,
        ...(accountId ? { accountId } : {}),
      },
    });

    if (!pm) {
      pm = await tx.paymentMethod.findFirst({
        where: { type: norm, isActive: true },
      });
    }

    if (pm) {
      if (accountId && !pm.accountId) {
        pm = await tx.paymentMethod.update({
          where: { id: pm.id },
          data: { accountId },
        });
      }
      return pm;
    }

    const defaultNames: Record<string, string> = {
      CASH: 'Efectivo',
      BANK_TRANSFER: 'Transferencia Bancaria',
      CREDIT_CARD: 'Tarjeta / Pago Digital',
      CUSTOMER_CREDIT: 'Cuenta Corriente',
      GIFT_CARD: 'Tarjeta de Regalo',
      LOYALTY: 'Puntos de Fidelización',
    };

    pm = await tx.paymentMethod.create({
      data: {
        name: defaultNames[norm] || norm,
        type: norm,
        accountId: accountId || null,
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
    const norm = normalizePaymentMethodType(type);
    const pm = await this.ensurePaymentMethod(tx, norm);
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
