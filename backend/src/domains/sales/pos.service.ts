import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { CreateOrderDto } from './dto/create-order.dto';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { CashService } from '../finance/cash/cash.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as crypto from 'crypto';

export type PosQrPaymentStatus = 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED';

interface PosQrOrder {
  orderId: string;
  amount: number;
  title: string;
  qrData: string;
  status: PosQrPaymentStatus;
  createdAt: number;
}

@Injectable()
export class PosService {
  private readonly qrOrders = new Map<string, PosQrOrder>();
  private static readonly QR_TTL_MS = 15 * 60 * 1000;
  private static readonly QR_MOCK_AUTO_APPROVE_MS = 25_000;

  constructor(
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly pricingService: PricingService,
    private readonly rulesEngine: RulesEngineService,
    private readonly cashService: CashService,
    private readonly prisma: PrismaService,
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

  private purgeExpiredQrOrders() {
    const now = Date.now();
    for (const [id, order] of this.qrOrders.entries()) {
      if (now - order.createdAt > PosService.QR_TTL_MS) {
        this.qrOrders.delete(id);
      }
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

  createQrOrder(amount: number, title: string) {
    this.purgeExpiredQrOrders();
    const orderId = `POS-QR-${Date.now()}`;
    const qrData = `00020101021243650016COM.MERCADOPAGO...${orderId}-AMT${amount}`;

    this.qrOrders.set(orderId, {
      orderId,
      amount,
      title,
      qrData,
      status: 'PENDING',
      createdAt: Date.now(),
    });

    return { orderId, qrData };
  }

  getQrOrderStatus(orderId: string) {
    this.purgeExpiredQrOrders();
    const order = this.qrOrders.get(orderId);
    if (!order) {
      throw new NotFoundException('Orden QR no encontrada o expirada.');
    }

    if (order.status === 'PENDING') {
      const elapsed = Date.now() - order.createdAt;
      if (elapsed > PosService.QR_TTL_MS) {
        order.status = 'EXPIRED';
      } else if (elapsed > PosService.QR_MOCK_AUTO_APPROVE_MS) {
        order.status = 'APPROVED';
      }
    }

    return {
      orderId: order.orderId,
      status: order.status,
      amount: order.amount,
      title: order.title,
    };
  }

  confirmQrOrder(orderId: string) {
    const order = this.qrOrders.get(orderId);
    if (!order) {
      throw new NotFoundException('Orden QR no encontrada o expirada.');
    }
    if (order.status === 'EXPIRED') {
      throw new BadRequestException('La orden QR expiró.');
    }
    order.status = 'APPROVED';
    return { orderId, status: order.status };
  }

  async getCatalogSyncData() {
    const catalog = await this.prisma.productVariant.findMany({
      where: { isActive: true },
      include: {
        product: { include: { category: true, brand: true } },
        barcodes: true,
      },
    });

    return {
      status: 'SYNC_READY',
      timestamp: new Date().toISOString(),
      data: catalog.map(v => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        barcodes: v.barcodes.map(b => b.barcode),
        name: v.product.name,
        basePrice: v.basePrice,
        categoryId: v.product.categoryId,
        categoryName: v.product.category.name,
        brandName: v.product.brand?.name,
      })),
    };
  }
}
