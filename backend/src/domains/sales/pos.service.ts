import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { IdentifiersService } from '../catalog/identifiers.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PosService {
  constructor(
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly identifiersService: IdentifiersService,
    private readonly pricingService: PricingService,
    private readonly rulesEngine: RulesEngineService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * BARCODE SCAN: Translates raw laser scanner input into a sellable Variant object.
   */
  async resolveBarcode(barcode: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { barcode },
      include: {
        product: {
          include: { category: true }
        }
      }
    });

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
      size: variant.size
    };
  }

  /**
   * QUICK SALE: Streamlined checkout for high-volume environments.
   */
  async processQuickSale(payload: {
    cashRegisterId: string;
    variantId: string;
    categoryId: string;
    accountId: string;
    cashShiftId?: string;
  }) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: payload.cashRegisterId },
      include: { branch: true }
    });

    if (!register) throw new NotFoundException('Caja no encontrada.');

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId: register.branchId, isActive: true }
    });

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
        }
      ],
      paymentMethod: 'CASH' as any,
      paymentAccountId: payload.accountId,
      cashShiftId: payload.cashShiftId,
    };

    return this.checkoutOrchestrator.processCheckout(quickOrderDto);
  }

  /**
   * CALCULATE CART: Real-time pricing and promotion evaluation.
   */
  async calculateCart(dto: {
    lines: { variantId: string; quantity: number; discountPct?: number }[];
    cartDiscountPct?: number;
    customerId?: string;
  }) {
    const evaluatedLines = [];
    
    for (const lineDto of dto.lines) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: lineDto.variantId },
        include: { product: true }
      });

      if (!variant) throw new NotFoundException(`Producto ${lineDto.variantId} no encontrado.`);

      const resolvedBasePrice = await this.pricingService.resolvePrice(
        lineDto.variantId, 
        variant.basePrice, 
        dto.customerId
      );

      const discountAmount = lineDto.discountPct 
        ? (resolvedBasePrice * (lineDto.discountPct / 100)) 
        : 0;

      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: variant.product.categoryId,
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        discountAmount: discountAmount,
        finalPrice: resolvedBasePrice - discountAmount
      });
    }

    const cartEvaluation = await this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
      id: crypto.randomUUID(),
      variantId: l.variantId,
      categoryId: l.categoryId,
      quantity: l.quantity,
      unitPrice: l.basePrice
    })));

    return {
      subtotal: Number(cartEvaluation.originalTotal.toFixed(2)),
      lineDiscountsTotal: Number(evaluatedLines.reduce((acc, l) => acc + (l.discountAmount * l.quantity), 0).toFixed(2)),
      cartDiscountTotal: Number(cartEvaluation.discountTotal.toFixed(2)),
      grandTotal: Number(cartEvaluation.finalTotal.toFixed(2)),
      appliedPromotions: cartEvaluation.appliedPromotions,
      lines: evaluatedLines.map(l => ({
        variantId: l.variantId,
        originalPrice: l.basePrice,
        finalPrice: l.finalPrice,
        discountAmount: l.discountAmount
      }))
    };
  }

  async searchCatalog(query: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { product: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { 
        product: { include: { category: true, brand: true } },
        stockLevels: true,
      },
      take: 20,
    });

    return variants.map(v => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode,
      name: v.product?.name || 'Producto Desconocido',
      category: v.product?.category?.name,
      brand: v.product?.brand?.name,
      size: v.size,
      color: v.color,
      costPrice: v.costPrice || 0,
      basePrice: v.basePrice || 0,
      stock: v.stockLevels.reduce((acc, s) => acc + s.availableQuantity, 0),
    }));
  }

  async getRegisters(branchId?: string) {
    const where: any = { isActive: true };
    if (branchId && branchId !== '' && branchId !== 'current-branch') {
      where.branchId = branchId;
    }
    
    return this.prisma.cashRegister.findMany({
      where,
      include: { branch: true }
    });
  }

  async getCurrentSession(registerId: string) {
    return this.prisma.cashShift.findFirst({
      where: { 
        cashRegisterId: registerId,
        status: 'OPEN'
      },
      include: { cashRegister: true }
    });
  }

  async openSession(dto: { cashRegisterId: string; openingAmount: number; userId: string }) {
    const existing = await this.getCurrentSession(dto.cashRegisterId);
    if (existing) throw new BadRequestException('Ya existe una sesión abierta para esta caja.');

    return this.prisma.$transaction(async (tx) => {
      await tx.cashRegister.update({
        where: { id: dto.cashRegisterId },
        data: { status: 'OPEN' }
      });

      return tx.cashShift.create({
        data: {
          cashRegisterId: dto.cashRegisterId,
          openedByUserId: dto.userId,
          openingAmount: dto.openingAmount,
          status: 'OPEN'
        }
      });
    });
  }

  async closeSession(dto: { shiftId: string; closingAmount: number; userId: string; notes?: string }) {
    const shift = await this.prisma.cashShift.findUnique({
      where: { id: dto.shiftId }
    });

    if (!shift) throw new NotFoundException('Sesión no encontrada.');
    if (shift.status === 'CLOSED') throw new BadRequestException('La sesión ya se encuentra cerrada.');

    return this.prisma.$transaction(async (tx) => {
      await tx.cashRegister.update({
        where: { id: shift.cashRegisterId },
        data: { status: 'CLOSED' }
      });

      return tx.cashShift.update({
        where: { id: dto.shiftId },
        data: {
          status: 'CLOSED',
          closedByUserId: dto.userId,
          closingAmount: dto.closingAmount,
          closedAt: new Date(),
          notes: dto.notes
        }
      });
    });
  }

  async getCatalogSyncData() {
    const catalog = await this.prisma.productVariant.findMany({
      where: { isActive: true },
      include: {
        product: { include: { category: true, brand: true } }
      }
    });

    return {
      status: 'SYNC_READY',
      timestamp: new Date().toISOString(),
      data: catalog.map(v => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        name: v.product.name,
        basePrice: v.basePrice,
        categoryId: v.product.categoryId,
        categoryName: v.product.category.name,
        brandName: v.product.brand?.name
      }))
    };
  }
}
