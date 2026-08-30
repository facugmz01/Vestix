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

  private async findVariantByBarcode(rawCode: string) {
    const code = (rawCode || '').replace(/[\r\n\t]/g, '').trim();
    if (!code) return null;

    const productInclude = {
      include: {
        category: true,
        brand: true,
        comboLines: {
          include: {
            childVariant: {
              include: { product: true }
            }
          }
        }
      }
    };

    // 1. Primary barcode match
    const byPrimary = await this.prisma.productVariant.findFirst({
      where: {
        barcode: { equals: code, mode: 'insensitive' },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: productInclude,
        barcodes: true,
      },
    });
    if (byPrimary) return byPrimary;

    // 2. Secondary/Alternate barcode match (ProductBarcode)
    const alt = await this.prisma.productBarcode.findFirst({
      where: {
        barcode: { equals: code, mode: 'insensitive' },
        variant: { isActive: true, product: { isActive: true } },
      },
      include: {
        variant: {
          include: {
            product: productInclude,
            barcodes: true,
          },
        },
      },
    });
    if (alt?.variant) return alt.variant;

    // 3. Variant SKU match
    const bySku = await this.prisma.productVariant.findFirst({
      where: {
        sku: { equals: code, mode: 'insensitive' },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: productInclude,
        barcodes: true,
      },
    });
    if (bySku) return bySku;

    // 4. Product baseSku match (first active variant)
    const byBaseSku = await this.prisma.productVariant.findFirst({
      where: {
        product: { baseSku: { equals: code, mode: 'insensitive' }, isActive: true },
        isActive: true,
      },
      include: {
        product: productInclude,
        barcodes: true,
      },
    });
    if (byBaseSku) return byBaseSku;

    // 5. Variant ID or Product ID match (UUID lookup)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(code);
    if (isUuid) {
      const byId = await this.prisma.productVariant.findFirst({
        where: { id: code, isActive: true, product: { isActive: true } },
        include: {
          product: productInclude,
          barcodes: true,
        },
      });
      if (byId) return byId;

      const byProductId = await this.prisma.productVariant.findFirst({
        where: { productId: code, isActive: true, product: { isActive: true } },
        include: {
          product: productInclude,
          barcodes: true,
        },
      });
      if (byProductId) return byProductId;
    }

    return null;
  }

  private async setQrOrderStatus(orderId: string, status: PosQrPaymentStatus) {
    const order = await this.qrStore.updateStatus(orderId, status);
    if (order) {
      this.qrStatusEvents.next({ orderId, status });
    }
  }

  async resolveBarcode(
    barcode: string,
    options?: { branchId?: string; priceListId?: string; customerId?: string },
  ) {
    const cleanCode = (barcode || '').replace(/[\r\n\t]/g, '').trim();
    const variant = await this.findVariantByBarcode(cleanCode);

    if (!variant) {
      throw new NotFoundException(`Producto o variante con código "${cleanCode}" no encontrado.`);
    }

    const [resolvedPrice, stockLevels, warehouses, pricingSettings] = await Promise.all([
      this.pricingService.resolvePrice(
        variant.id,
        variant.basePrice,
        options?.customerId,
        options?.branchId,
        options?.priceListId,
      ),
      this.prisma.stockLevel.findMany({ where: { variantId: variant.id } }),
      this.prisma.warehouse.findMany({ include: { branch: true } }),
      this.settingsService.getPricingSettings(),
    ]);

    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    const totalStock = stockLevels.reduce((acc, s) => acc + s.availableQuantity, 0);

    const productImages = variant.product?.images;
    const firstProductImage = Array.isArray(productImages) ? (productImages as string[])[0] : undefined;

    return {
      variantId: variant.id,
      id: variant.id,
      productId: variant.productId,
      categoryId: variant.product.categoryId,
      category: variant.product.category?.name,
      brand: variant.product.brand?.name,
      sku: variant.sku,
      barcode: variant.barcode,
      barcodes: [variant.barcode, ...(variant.barcodes?.map(b => b.barcode) || [])].filter(Boolean),
      name: variant.product.name,
      basePrice: resolvedPrice,
      originalBasePrice: variant.basePrice,
      costPrice: variant.costPrice,
      color: variant.color,
      size: variant.size,
      attributes: variant.attributes || {},
      imageUrl: variant.imageUrl || firstProductImage || null,
      stock: totalStock,
      product: {
        id: variant.product.id,
        name: variant.product.name,
        baseSku: variant.product.baseSku,
        description: variant.product.description,
        type: variant.product.type,
        images: Array.isArray(variant.product.images) ? variant.product.images : [],
        category: variant.product.category ? { id: variant.product.category.id, name: variant.product.category.name } : null,
        brand: variant.product.brand ? { id: variant.product.brand.id, name: variant.product.brand.name } : null,
        isActive: variant.product.isActive,
        comboLines: (variant.product as any).comboLines,
      },
      stockLevels: stockLevels.map(s => {
        const wh = warehouseMap.get(s.warehouseId);
        return {
          id: s.id,
          warehouseId: s.warehouseId,
          warehouseName: wh?.name || 'Depósito',
          branchId: s.branchId || wh?.branchId,
          branchName: wh?.branch?.name || 'Sucursal',
          availableQuantity: s.availableQuantity,
          physicalQuantity: s.physicalQuantity,
          reservedQuantity: s.reservedQuantity,
        };
      }),
      pricing: {
        effectivePrice: resolvedPrice,
        basePrice: variant.basePrice,
        taxRate: pricingSettings?.vatDefaultPct ?? 21,
        taxIncluded: pricingSettings?.showPricesWithTax ?? true,
      },
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

    // Match checkout.orchestrator: evaluate promos on the post line-discount price.
    const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(
      evaluatedLines.map(l => ({
        id: crypto.randomUUID(),
        variantId: l.variantId,
        categoryId: l.categoryId,
        quantity: l.quantity,
        unitPrice: l.finalPrice,
      })),
    );

    const lineDiscountsTotal = evaluatedLines.reduce(
      (acc, l) => acc + l.discountAmount * l.quantity,
      0,
    );
    const promotionDiscount = cartEvaluation.discountTotal;
    // List-price subtotal (before line discounts), for POS display.
    const listSubtotal = evaluatedLines.reduce(
      (acc, l) => acc + l.basePrice * l.quantity,
      0,
    );
    let grandTotal = cartEvaluation.finalTotal;
    let globalPctDiscount = 0;
    if (dto.cartDiscountPct && dto.cartDiscountPct > 0) {
      globalPctDiscount = grandTotal * (dto.cartDiscountPct / 100);
      grandTotal -= globalPctDiscount;
    }

    return {
      subtotal: Number(listSubtotal.toFixed(2)),
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

  async searchCatalog(
    query: string,
    customerId?: string,
    filters?: { categoryId?: string; brandId?: string; branchId?: string; priceListId?: string },
  ) {
    const q = (query || '').replace(/[\r\n\t]/g, '').trim();
    const categoryId = filters?.categoryId?.trim() || undefined;
    const brandId = filters?.brandId?.trim() || undefined;
    const branchId = filters?.branchId?.trim() || undefined;
    const priceListId = filters?.priceListId?.trim() || undefined;

    // Empty query with no filters is intentional for the POS product grid
    // (frontend calls search with q=''). Purchase UIs gate requests until the
    // user types or picks a filter, so they never hit this browse path.
    const productFilter: Record<string, any> = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(brandId ? { brandId } : {}),
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q);

    const variants = await this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: productFilter,
        ...(q
          ? {
              OR: [
                { sku: { contains: q, mode: 'insensitive' } },
                { barcode: { contains: q, mode: 'insensitive' } },
                { barcodes: { some: { barcode: { contains: q, mode: 'insensitive' } } } },
                { product: { name: { contains: q, mode: 'insensitive' } } },
                { product: { baseSku: { contains: q, mode: 'insensitive' } } },
                ...(isUuid ? [{ id: q }, { productId: q }] : []),
              ],
            }
          : {}),
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            comboLines: {
              include: {
                childVariant: {
                  include: { product: true }
                }
              }
            }
          }
        },
        barcodes: true,
      },
      take: 50,
      orderBy: { sku: 'asc' },
    });

    if (variants.length === 0) {
      return [];
    }

    const variantIds = variants.map(v => v.id);

    // Parallel batch queries for stock, warehouses, batch pricing, and tax settings
    const [stockLevels, warehouses, pricingSettings, priceMap] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where: { variantId: { in: variantIds } },
      }),
      this.prisma.warehouse.findMany({
        include: { branch: true },
      }),
      this.settingsService.getPricingSettings(),
      this.pricingService.resolveVariantPricingBatch(
        variants.map(v => ({ id: v.id, basePrice: v.basePrice || 0, costPrice: v.costPrice || 0 })),
        { customerId, branchId, priceListId },
      ),
    ]);

    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));

    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    const mapped = variants.map(v => {
      const variantStocks = stockByVariant.get(v.id) || [];
      const totalStock = variantStocks.reduce((acc, s) => acc + s.availableQuantity, 0);
      const pricingInfo = priceMap.get(v.id) || {
        resolvedPrice: v.basePrice || 0,
        overridePrice: null,
        basePrice: v.basePrice || 0,
        priceListName: 'General',
        currency: 'ARS',
      };

      const productImages = v.product?.images;
      const firstProductImage = Array.isArray(productImages) ? (productImages as string[])[0] : undefined;
      const allBarcodes = [v.barcode, ...(v.barcodes?.map(b => b.barcode) || [])].filter(Boolean) as string[];

      // Check if this variant was an exact match to the query
      const isExactMatch = Boolean(
        q && (
          v.barcode?.toLowerCase() === q.toLowerCase() ||
          v.sku?.toLowerCase() === q.toLowerCase() ||
          allBarcodes.some(b => b.toLowerCase() === q.toLowerCase())
        ),
      );

      return {
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        barcode: v.barcode || null,
        barcodes: allBarcodes,
        name: v.product?.name || 'Producto Desconocido',
        categoryId: v.product?.categoryId,
        category: v.product?.category?.name,
        brand: v.product?.brand?.name,
        size: v.size || null,
        color: v.color || null,
        attributes: (v.attributes || {}) as Record<string, string>,
        costPrice: v.costPrice || 0,
        basePrice: pricingInfo.resolvedPrice,
        originalBasePrice: v.basePrice || 0,
        overridePrice: pricingInfo.overridePrice,
        imageUrl: v.imageUrl || firstProductImage || null,
        stock: totalStock,
        isExactMatch,

        // Rich nested structures for Price Inquiry & Sales Forms
        product: {
          id: v.product?.id,
          name: v.product?.name || 'Producto Desconocido',
          baseSku: v.product?.baseSku,
          description: v.product?.description,
          type: v.product?.type,
          images: Array.isArray(v.product?.images) ? (v.product.images as string[]) : [],
          category: v.product?.category ? { id: v.product.category.id, name: v.product.category.name } : null,
          brand: v.product?.brand ? { id: v.product.brand.id, name: v.product.brand.name } : null,
          isActive: v.product?.isActive,
          comboLines: (v.product as any)?.comboLines,
        },
        stockLevels: variantStocks.map(s => {
          const wh = warehouseMap.get(s.warehouseId);
          return {
            id: s.id,
            warehouseId: s.warehouseId,
            warehouseName: wh?.name || 'Depósito',
            branchId: s.branchId || wh?.branchId,
            branchName: wh?.branch?.name || 'Sucursal',
            availableQuantity: s.availableQuantity,
            physicalQuantity: s.physicalQuantity,
            reservedQuantity: s.reservedQuantity,
          };
        }),
        pricing: {
          effectivePrice: pricingInfo.resolvedPrice,
          basePrice: v.basePrice || 0,
          overridePrice: pricingInfo.overridePrice,
          priceListId: pricingInfo.priceListId,
          priceListName: pricingInfo.priceListName,
          currency: pricingInfo.currency,
          taxRate: pricingSettings?.vatDefaultPct ?? 21,
          taxIncluded: pricingSettings?.showPricesWithTax ?? true,
        },
      };
    });

    // If there's an exact barcode/SKU match, sort it to the very top
    if (q) {
      mapped.sort((a, b) => (b.isExactMatch ? 1 : 0) - (a.isExactMatch ? 1 : 0));
    }

    return mapped;
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
    const { orderId: localOrderId, mpOrderId, qrData } = await this.mercadoPagoService.createPosQrOrder({
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
      mpOrderId,
    });

    return { orderId: localOrderId, qrData };
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
      } else if (order.mpOrderId) {
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
