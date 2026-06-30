import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  StockValuationReport,
  LowStockAlert,
} from './models/report.model';

const DEFAULT_REORDER_POINT = 5;

@Injectable()
export class StockReportService {
  private readonly logger = new Logger(StockReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStockValuation(branchId?: string): Promise<StockValuationReport> {
    this.logger.log(`[StockReport] Valuation requested${branchId ? ` for branch ${branchId}` : ' (all branches)'}`);

    const branchFilter = branchId ? { warehouse: { branchId } } : {};

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: { ...branchFilter }
    });

    const variantIds = [...new Set(stockLevels.map(sl => sl.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    const lines = stockLevels.map(sl => {
      const v = variantMap.get(sl.variantId);
      const unitCostWac = v?.costPrice || 0;
      const unitRetailPrice = v?.basePrice || 0;
      
      return {
        variantId: sl.variantId,
        sku: v?.sku || 'Unknown',
        availableQty: sl.availableQuantity,
        reservedQty: sl.reservedQuantity,
        unitCostWac,
        unitRetailPrice,
        totalCostValue: parseFloat((sl.availableQuantity * unitCostWac).toFixed(2)),
        totalRetailValue: parseFloat((sl.availableQuantity * unitRetailPrice).toFixed(2)),
      };
    });

    const totalCost = lines.reduce((s, l) => s + l.totalCostValue, 0);
    const totalRetail = lines.reduce((s, l) => s + l.totalRetailValue, 0);

    return {
      generatedAt: new Date(),
      branchId,
      totalSKUs: lines.length,
      totalUnits: lines.reduce((s, l) => s + l.availableQty, 0),
      totalValueAtCost: parseFloat(totalCost.toFixed(2)),
      totalValueAtRetail: parseFloat(totalRetail.toFixed(2)),
      potentialMargin: totalRetail > 0 ? parseFloat((((totalRetail - totalCost) / totalRetail) * 100).toFixed(2)) : 0,
      lines,
    };
  }

  async getLowStockAlerts(branchId?: string, reorderPoint = DEFAULT_REORDER_POINT): Promise<LowStockAlert[]> {
    const branchFilter = branchId ? { warehouse: { branchId } } : {};

    const stockLevels = await this.prisma.stockLevel.findMany({
      where: {
        availableQuantity: { lte: reorderPoint },
        ...branchFilter
      },
      include: {
        warehouse: true
      }
    });

    const variantIds = [...new Set(stockLevels.map(sl => sl.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    return stockLevels.map(sl => {
      const v = variantMap.get(sl.variantId);
      return {
        variantId: sl.variantId,
        sku: v?.sku || 'Unknown',
        name: v?.product?.name || 'Unknown',
        branchId: sl.warehouse?.branchId || branchId || 'Unknown',
        availableQuantity: sl.availableQuantity,
        reorderPoint: reorderPoint
      };
    });
  }
}
