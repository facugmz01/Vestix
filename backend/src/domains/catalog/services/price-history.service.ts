import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

export type PriceChangeSource = 'MANUAL' | 'BULK' | 'IMPORT' | 'PROMO' | 'PRICE_LIST';

@Injectable()
export class PriceHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async recordChange(params: {
    variantId: string;
    oldPrice: number;
    newPrice: number;
    source: PriceChangeSource;
    priceListId?: string;
    changedBy?: string;
  }) {
    if (params.oldPrice === params.newPrice) return null;

    return this.prisma.priceHistory.create({
      data: {
        variantId: params.variantId,
        oldPrice: params.oldPrice,
        newPrice: params.newPrice,
        source: params.source,
        priceListId: params.priceListId,
        changedBy: params.changedBy,
      },
    });
  }

  async getByVariant(variantId: string, limit = 50) {
    return this.prisma.priceHistory.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getByProduct(productId: string, limit = 100) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true, sku: true },
    });
    const variantIds = variants.map(v => v.id);
    if (!variantIds.length) return [];

    const history = await this.prisma.priceHistory.findMany({
      where: { variantId: { in: variantIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const skuMap = new Map(variants.map(v => [v.id, v.sku]));
    return history.map(h => ({ ...h, sku: skuMap.get(h.variantId) }));
  }
}
