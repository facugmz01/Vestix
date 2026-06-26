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
      where: { ...branchFilter },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    const lines = stockLevels.map(sl => {
      const unitCostWac = sl.variant?.costPrice || 0;
      const unitRetailPrice = sl.variant?.basePrice || 0;
      
      return {
        variantId: sl.variantId,
        sku: sl.variant?.sku || 'Unknown',
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
        variant: {
          include: { product: true }
        },
        warehouse: true
      }
    });

    return stockLevels.map(sl => ({
      variantId: sl.variantId,
      sku: sl.variant?.sku || 'Unknown',
      name: sl.variant?.product?.name || 'Unknown',
      branchId: sl.warehouse?.branchId || branchId || 'Unknown',
      availableQuantity: sl.availableQuantity,
      reorderPoint: reorderPoint
    }));
  }
}
