import { Injectable, NotFoundException } from '@nestjs/common';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { IdentifiersService } from '../identifiers/identifiers.service';
import { CreateOrderDto } from '../sales/dto/create-order.dto';
import { PricingService } from '../pricing/pricing.service';
import { RulesEngineService } from '../pricing/rules-engine.service';
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
   * Crucial for POS speed: cashiers just scan, the system figures out the product and base price.
   */
  async resolveBarcode(barcode: string) {
    // In production:
    // const variant = await this.prisma.productVariant.findFirst({ where: { barcode }, include: { product: true } });
    // if (!variant) throw new NotFoundException('Barcode not recognized in the system.');
    
    if (!barcode || barcode.length < 5) {
      throw new NotFoundException('Invalid barcode format.');
    }

    return {
      variantId: 'mock-variant-id-123',
      categoryId: 'mock-category-id',
      sku: 'MOCK-SKU',
      name: 'Resolved Product via Scanner',
      basePrice: 20.00
    };
  }

  /**
   * QUICK SALE: For high-volume retail environments (e.g., Kiosks).
   * Cashiers don't build long orders; they scan 1 item and hit "Cash".
   * This bypasses the full cart logic and directly injects a streamlined payload into the Sales orchestrator.
   */
  async processQuickSale(payload: {
    branchId: string;
    warehouseId: string;
    variantId: string;
    categoryId: string;
    accountId: string; // The physical cash drawer receiving the money
  }) {
    const quickOrderDto: CreateOrderDto = {
      id: crypto.randomUUID(), // Server-generated for a quick sale, assuming POS is strictly online right now
      branchId: payload.branchId,
      warehouseId: payload.warehouseId,
      source: 'POS' as any,
      lines: [
        {
          variantId: payload.variantId,
          categoryId: payload.categoryId,
          quantity: 1, // Quick sale is always 1 item by definition
        }
      ],
      paymentMethod: 'CASH' as any,
      paymentAccountId: payload.accountId,
    };

    return this.checkoutOrchestrator.processCheckout(quickOrderDto);
  }

  /**
   * CALCULATE CART: Delegates to the pricing engine to calculate promotions.
   * Mirrors the initial stages of processCheckout but without committing to the DB.
   */
  async calculateCart(dto: {
    lines: { variantId: string; quantity: number; discountPct?: number }[];
    cartDiscountPct?: number;
    customerId?: string;
  }) {
    const evaluatedLines = [];
    
    // Resolve base prices securely
    for (const lineDto of dto.lines) {
      // For now, mock a flat 20.00 base price
      const productBasePrice = 20.00; 
      const resolvedBasePrice = await this.pricingService.resolvePrice(lineDto.variantId, productBasePrice, dto.customerId);
      evaluatedLines.push({
        variantId: lineDto.variantId,
        categoryId: 'mock-category-id', // In prod, this comes from the DB product relation
        quantity: lineDto.quantity,
        basePrice: resolvedBasePrice,
        discountAmount: lineDto.discountPct ? (resolvedBasePrice * (lineDto.discountPct / 100)) : 0, 
        finalPrice: resolvedBasePrice
      });
    }

    // Apply cart-level rules engine
    const cartEvaluation = this.rulesEngine.evaluateCartPromotions(evaluatedLines.map(l => ({
      id: crypto.randomUUID(),
      variantId: l.variantId,
      categoryId: l.categoryId,
      quantity: l.quantity,
      unitPrice: l.basePrice
    })));

    // Return format mapped to frontend POSCalculateResponse
    return {
      subtotal: cartEvaluation.originalTotal,
      lineDiscountsTotal: 0, // Mocked for now, real implementation aggregates discountAmounts
      cartDiscountTotal: cartEvaluation.discountTotal,
      grandTotal: cartEvaluation.finalTotal,
      lines: evaluatedLines.map(l => ({
        variantId: l.variantId,
        originalPrice: l.basePrice,
        finalPrice: l.finalPrice
      }))
    };
  }

  async searchCatalog(query: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { color: { contains: query, mode: 'insensitive' } },
          { size: { contains: query, mode: 'insensitive' } },
          { product: { name: { contains: query, mode: 'insensitive' } } },
          { product: { description: { contains: query, mode: 'insensitive' } } },
          { product: { category: { name: { contains: query, mode: 'insensitive' } } } },
          { product: { brand: { name: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      include: { 
        product: {
          include: {
            category: true,
            brand: true,
          }
        },
        stockLevels: true,
      },
      take: 30,
    });

    return variants.map(v => ({
      ...v,
      // For legacy POS support if needed:
      name: v.product?.name || 'Producto Desconocido',
      product: v.product,
      stockLevels: v.stockLevels,
      basePrice: v.basePrice || 0,
      costPrice: v.costPrice || v.product?.costPrice || 0,
    }));
  }
}
