import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Observable, Subject, filter, map } from 'rxjs';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { CreateOrderDto } from './dto/create-order.dto';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { CashService } from '../finance/cash/cash.service';
import { MercadoPagoService } from './mercadopago.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { PosQrStoreService, type PosQrPaymentStatus } from './pos-qr-store.service';
import * as crypto from 'crypto';

export type { PosQrPaymentStatus };

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);
  private readonly qrStatusEvents = new Subject<{ orderId: string; status: PosQrPaymentStatus }>();
  private static readonly QR_TTL_MS = 15 * 60 * 1000;
  private static readonly QR_MOCK_AUTO_APPROVE_MS = 25_000;

  constructor(
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly pricingService: PricingService,
    private readonly rulesEngine: RulesEngineService,
    private readonly cashService: CashService,
    private readonly mercadoPagoService: MercadoPagoService,
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly qrStore: PosQrStoreService,
  ) {}

  private async findVariantByBarcode(barcode: string) {
    const byPrimary = await this.prisma.productVariant.findUnique({
      where: { barcode },
      include: { product: { include: { category: true } } },
    });
    if (byPrimary) return byPrimary;

    const alt = await this.prisma.productBarcode.findUnique({
      where: { barcode },
      include: { variant: { include: { product: { include: { category: true } } } } },
    });
    return alt?.variant ?? null;
  }

  private async setQrOrderStatus(orderId: string, status: PosQrPaymentStatus) {
    const order = await this.qrStore.updateStatus(orderId, status);
    if (order) {
      this.qrStatusEvents.next({ orderId, status });
    }
  }

  async resolveBarcode(barcode: string) {
    const variant = await this.findVariantByBarcode(barcode);

    if (!variant) {
      throw new NotFoundException(`Producto con código de barras ${barcode} no encontrado.`);
    }

    return {
      variantId: variant.id,
      categoryId: variant.product.categoryId,
      sku: variant.sku,
      name: variant.product.name,
      basePrice: variant.basePrice,
      color: variant.color,
      size: variant.size,
    };
  }

  async processQuickSale(payload: {
    cashRegisterId: string;
    variantId: string;
    categoryId: string;
    accountId: string;
    cashShiftId?: string;
    userId?: string;
  }) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: payload.cashRegisterId },
      include: { branch: true },
    });

    if (!register) throw new NotFoundException('Caja no encontrada.');

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId: register.branchId, isActive: true },
    });

    let cashShiftId = payload.cashShiftId;
    if (!cashShiftId) {
      const openShift = await this.prisma.cashShift.findFirst({
        where: { cashRegisterId: payload.cashRegisterId, status: 'OPEN' },
      });
      if (!openShift) {
        throw new BadRequestException('No hay turno abierto para esta caja.');
      }
      cashShiftId = openShift.id;
    }

    const quickOrderDto: CreateOrderDto = {
      id: crypto.randomUUID(),
      branchId: register.branchId,
      warehouseId: warehouse?.id,
      source: 'POS' as any,
      lines: [
        {
          variantId: payload.variantId,
          categoryId: payload.categoryId,
          quantity: 1,
        },
      ],
      paymentMethod: 'CASH' as any,
      paymentAccountId: payload.accountId,
      cashShiftId,
    };

    return this.checkoutOrchestrator.processCheckout(quickOrderDto, payload.userId);
  }

  async calculateCart(dto: {
    lines: { variantId: string; quantity: number; discountPct?: number }[];
    cartDiscountPct?: number;
    customerId?: string;
  }) {
    const evaluatedLines = [];

    for (const lineDto of dto.lines) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: lineDto.variantId },
        include: { product: true },
      });

      if (!variant) throw new NotFoundException(`Producto ${lineDto.variantId} no encontrado.`);

      const resolvedBasePrice = await this.pricingService.resolvePrice(
        lineDto.variantId,
        variant.basePrice,
        dto.customerId,
      );

      const discountAmount = lineDto.discountPct
        ? resolvedBasePrice * (lineDto.discountPct / 100)
        : 0;

      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: variant.product.categoryId,
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        discountAmount,
        finalPrice: resolvedBasePrice - discountAmount,
      });
    }

    const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(
      evaluatedLines.map(l => ({
        id: crypto.randomUUID(),
        variantId: l.variantId,
        categoryId: l.categoryId,
        quantity: l.quantity,
        unitPrice: l.basePrice,
      })),
    );

    const lineDiscountsTotal = evaluatedLines.reduce(
      (acc, l) => acc + l.discountAmount * l.quantity,
      0,
    );
    const promotionDiscount = cartEvaluation.discountTotal;
    let grandTotal = cartEvaluation.finalTotal;
    let globalPctDiscount = 0;
    if (dto.cartDiscountPct && dto.cartDiscountPct > 0) {
      globalPctDiscount = grandTotal * (dto.cartDiscountPct / 100);
      grandTotal -= globalPctDiscount;
    }

    return {
      subtotal: Number(cartEvaluation.originalTotal.toFixed(2)),
      lineDiscountsTotal: Number(lineDiscountsTotal.toFixed(2)),
      cartDiscountTotal: Number((promotionDiscount + globalPctDiscount).toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      appliedPromotions: cartEvaluation.appliedPromotions,
      lines: evaluatedLines.map(l => ({
        variantId: l.variantId,
        originalPrice: l.basePrice,
        finalPrice: l.finalPrice,
        discountAmount: l.discountAmount,
      })),
    };
  }

  async searchCatalog(query: string, customerId?: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { barcodes: { some: { barcode: { contains: query, mode: 'insensitive' } } } },
          { product: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        product: { include: { category: true, brand: true } },
        barcodes: true,
      },
      take: 20,
    });

    const variantIds = variants.map(v => v.id);
    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { variantId: { in: variantIds } },
    });
    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    return Promise.all(
      variants.map(async v => {
        const resolvedPrice = await this.pricingService.resolvePrice(
          v.id,
          v.basePrice || 0,
          customerId,
        );
        const variantStocks = stockByVariant.get(v.id) || [];

        const productImages = v.product?.images;
        const firstProductImage = Array.isArray(productImages) ? (productImages as string[])[0] : undefined;

        return {
          id: v.id,
          sku: v.sku,
          barcode: v.barcode,
          barcodes: v.barcodes.map(b => b.barcode),
          name: v.product?.name || 'Producto Desconocido',
          category: v.product?.category?.name,
          brand: v.product?.brand?.name,
          size: v.size,
          color: v.color,
          costPrice: v.costPrice || 0,
          basePrice: resolvedPrice,
          imageUrl: v.imageUrl || firstProductImage || null,
          stock: variantStocks.reduce((acc, s) => acc + s.availableQuantity, 0),
        };
      }),
    );
  }

  async getRegisters(branchId?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (branchId && branchId !== '' && branchId !== 'current-branch') {
      where.branchId = branchId;
    }

    return this.prisma.cashRegister.findMany({
      where,
      include: { branch: true },
    });
  }

  async getCurrentSession(registerId: string) {
    return this.cashService.getActiveShift(registerId);
  }

  async openSession(dto: { cashRegisterId: string; openingAmount: number; userId: string }) {
    return this.cashService.openShift(dto.cashRegisterId, dto.userId, dto.openingAmount);
  }

  async closeSession(dto: { shiftId: string; closingAmount: number; userId: string; notes?: string }) {
    return this.cashService.closeShift(dto.shiftId, dto.userId, dto.closingAmount, dto.notes);
  }

  async createQrOrder(amount: number, title: string) {
    await this.qrStore.purgeExpired();
    const orderId = `POS-QR-${Date.now()}`;

    const intSettings = await this.settingsService.getIntegrationSettings();
    const { orderId: localOrderId, mpOrderId, qrData, isMock } = await this.mercadoPagoService.createPosQrOrder({
      externalReference: orderId,
      amount,
      title,
      externalPosId: intSettings.mpExternalPosId,
      mode: intSettings.mpExternalPosId ? 'hybrid' : 'dynamic',
    });

    await this.qrStore.save({
      orderId: localOrderId,
      amount,
      title,
      qrData,
      status: 'PENDING',
      createdAt: Date.now(),
      isMock,
      mpOrderId,
    });

    return { orderId: localOrderId, qrData, isMock };
  }

  subscribeQrOrderStatus(orderId: string): Observable<{ data: { orderId: string; status: PosQrPaymentStatus } }> {
    return this.qrStatusEvents.pipe(
      filter(evt => evt.orderId === orderId),
      map(evt => ({ data: evt })),
    );
  }

  async handleMercadoPagoWebhook(
    body: Record<string, unknown>,
    headers?: Record<string, string | string[] | undefined>,
  ) {
    const type = (body?.type || body?.action) as string | undefined;
    const resourceId = ((body?.data as { id?: string })?.id || body?.resource) as string | number | undefined;

    if (!type || resourceId === undefined) return { received: true };

    if (headers) {
      const signatureResult = await this.mercadoPagoService.verifyWebhookSignature(headers, resourceId);
      if (!signatureResult.valid) {
        this.logger.warn(`[POS QR Webhook] ${signatureResult.error}`);
        return { received: false, error: signatureResult.error };
      }
    }

    if (type === 'order' || type === 'order.updated') {
      return this.handlePosOrderWebhook(String(resourceId));
    }

    if (type !== 'payment' && type !== 'payment.updated') {
      return { received: true };
    }

    try {
      const payment = await this.mercadoPagoService.fetchPayment(resourceId);
      if (!payment) {
        this.logger.warn('[POS QR Webhook] No access token or payment fetch failed');
        return { received: true };
      }

      const externalRef = payment.external_reference;
      const status = payment.status;

      if (!externalRef?.startsWith('POS-QR-')) {
        return { received: true };
      }

      if (status === 'approved') {
        await this.setQrOrderStatus(externalRef, 'APPROVED');
      } else if (status === 'rejected' || status === 'cancelled') {
        await this.setQrOrderStatus(externalRef, 'REJECTED');
      }

      return { received: true, orderId: externalRef, status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`[POS QR Webhook] Error: ${message}`);
      return { received: false };
    }
  }

  private async handlePosOrderWebhook(mpOrderId: string) {
    const order = await this.mercadoPagoService.fetchOrder(mpOrderId);
    if (!order) return { received: true };

    const externalRef = order.external_reference as string | undefined;
    if (!externalRef?.startsWith('POS-QR-')) {
      return { received: true };
    }

    const status = order.status as string;
    if (status === 'paid' || status === 'processed') {
      await this.setQrOrderStatus(externalRef, 'APPROVED');
    } else if (status === 'canceled' || status === 'expired') {
      await this.setQrOrderStatus(externalRef, 'REJECTED');
    }

    return { received: true, orderId: externalRef, status };
  }

  async getQrOrderStatus(orderId: string) {
    await this.qrStore.purgeExpired();
    const order = await this.qrStore.get(orderId);
    if (!order) {
      throw new NotFoundException('Orden QR no encontrada o expirada.');
    }

    if (order.status === 'PENDING') {
      const elapsed = Date.now() - order.createdAt;
      if (elapsed > PosService.QR_TTL_MS) {
        await this.setQrOrderStatus(orderId, 'EXPIRED');
        order.status = 'EXPIRED';
      } else if (order.isMock !== false && elapsed > PosService.QR_MOCK_AUTO_APPROVE_MS) {
        await this.setQrOrderStatus(orderId, 'APPROVED');
        order.status = 'APPROVED';
      } else if (order.isMock === false && order.mpOrderId) {
        const mpOrder = await this.mercadoPagoService.fetchOrder(order.mpOrderId);
        const mpStatus = mpOrder?.status as string | undefined;
        if (mpStatus === 'paid' || mpStatus === 'processed') {
          await this.setQrOrderStatus(orderId, 'APPROVED');
          order.status = 'APPROVED';
        } else if (mpStatus === 'canceled' || mpStatus === 'expired') {
          await this.setQrOrderStatus(orderId, 'REJECTED');
          order.status = 'REJECTED';
        }
      }
    }

    return {
      orderId: order.orderId,
      status: order.status,
      amount: order.amount,
      title: order.title,
    };
  }

  async confirmQrOrder(orderId: string) {
    const order = await this.qrStore.get(orderId);
    if (!order) {
      throw new NotFoundException('Orden QR no encontrada o expirada.');
    }
    if (order.status === 'EXPIRED') {
      throw new BadRequestException('La orden QR expiró.');
    }
    await this.setQrOrderStatus(orderId, 'APPROVED');
    return { orderId, status: 'APPROVED' as const };
  }

  async getShiftOrders(shiftId: string) {
    const orders = await this.prisma.saleOrder.findMany({
      where: {
        cashShiftId: shiftId,
        status: { in: ['COMPLETED', 'CONFIRMED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        customer: { select: { fullName: true } },
      },
    });

    return orders.map(o => ({
      id: o.id,
      grandTotal: o.grandTotal,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt,
      customerName: o.customer?.fullName || 'Consumidor Final',
    }));
  }

  async getCatalogSyncData(since?: string, branchId?: string) {
    const sinceDate = since ? new Date(since) : null;
    const variantWhere: Record<string, unknown> = { isActive: true };
    if (sinceDate && !Number.isNaN(sinceDate.getTime())) {
      variantWhere.updatedAt = { gt: sinceDate };
    }

    const catalog = await this.prisma.productVariant.findMany({
      where: variantWhere,
      include: {
        product: { include: { category: true, brand: true } },
        barcodes: true,
      },
    });

    const variantIds = catalog.map(v => v.id);
    const stockLevels = variantIds.length
      ? await this.prisma.stockLevel.findMany({
          where: {
            variantId: { in: variantIds },
            ...(branchId ? { branchId } : {}),
          },
        })
      : [];

    const stockByVariant = new Map<string, number>();
    for (const stock of stockLevels) {
      stockByVariant.set(
        stock.variantId,
        (stockByVariant.get(stock.variantId) || 0) + stock.availableQuantity,
      );
    }

    let removedIds: string[] = [];
    if (sinceDate && !Number.isNaN(sinceDate.getTime())) {
      const deactivated = await this.prisma.productVariant.findMany({
        where: { isActive: false, updatedAt: { gt: sinceDate } },
        select: { id: true },
      });
      removedIds = deactivated.map(v => v.id);
    }

    return {
      status: 'SYNC_READY',
      timestamp: new Date().toISOString(),
      incremental: !!sinceDate,
      removedIds,
      data: catalog.map(v => {
        const productImages = v.product?.images;
        const firstProductImage = Array.isArray(productImages)
          ? (productImages as string[])[0]
          : undefined;

        return {
          id: v.id,
          productId: v.productId,
          sku: v.sku,
          barcode: v.barcode,
          barcodes: v.barcodes.map(b => b.barcode),
          name: v.product.name,
          basePrice: v.basePrice,
          categoryId: v.product.categoryId,
          categoryName: v.product.category.name,
          brandName: v.product.brand?.name,
          size: v.size,
          color: v.color,
          imageUrl: v.imageUrl || firstProductImage || null,
          stock: stockByVariant.get(v.id) ?? 0,
          updatedAt: v.updatedAt.toISOString(),
        };
      }),
    };
  }
}
