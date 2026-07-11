import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CostingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Weighted Average Cost (WAC) on goods receipt.
   */
  async calculateWac(
    variantId: string,
    incomingQty: number,
    incomingUnitCost: number,
    tx?: any,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const variant = await db.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) return incomingUnitCost;

    const stockLevels = await db.stockLevel.findMany({ where: { variantId } });
    const onHandQty = stockLevels.reduce((sum: number, sl: any) => sum + (sl.quantity ?? 0), 0);
    const currentCost = variant.costPrice ?? 0;

    if (onHandQty <= 0 || incomingQty <= 0) {
      return incomingUnitCost;
    }

    const totalValue = onHandQty * currentCost + incomingQty * incomingUnitCost;
    const totalQty = onHandQty + incomingQty;
    return Math.round((totalValue / totalQty) * 10000) / 10000;
  }
}
