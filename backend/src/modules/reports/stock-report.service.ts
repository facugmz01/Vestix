import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    let warehouseCondition = Prisma.empty;
    if (branchId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { branchId },
        select: { id: true },
      });
      const warehouseIds = warehouses.map(w => w.id);
      if (warehouseIds.length > 0) {
        warehouseCondition = Prisma.sql`WHERE sl."warehouseId" IN (${Prisma.join(warehouseIds)})`;
      }
    }

    const lines: Array<{
      variantId: string;
      sku: string;
      availableQty: number;
      reservedQty: number;
      unitCostWac: number;
      unitRetailPrice: number;
      totalCostValue: number;
      totalRetailValue: number;
    }> = await this.prisma.$queryRaw`
      SELECT 
        sl."variantId",
        COALESCE(pv.sku, 'Unknown') AS sku,
        sl."availableQuantity"::int AS "availableQty",
        sl."reservedQuantity"::int AS "reservedQty",
        COALESCE(pv."costPrice", 0)::float AS "unitCostWac",
        COALESCE(pv."basePrice", 0)::float AS "unitRetailPrice",
        ROUND((sl."availableQuantity" * COALESCE(pv."costPrice", 0))::numeric, 2)::float AS "totalCostValue",
        ROUND((sl."availableQuantity" * COALESCE(pv."basePrice", 0))::numeric, 2)::float AS "totalRetailValue"
      FROM "inventory"."StockLevel" sl
      JOIN "catalog"."ProductVariant" pv ON pv.id = sl."variantId"
      ${warehouseCondition};
    `;

    let totalUnits = 0;
    let totalCost = 0;
    let totalRetail = 0;

    for (const l of lines || []) {
      totalUnits += Number(l.availableQty) || 0;
      totalCost += Number(l.totalCostValue) || 0;
      totalRetail += Number(l.totalRetailValue) || 0;
    }

    totalCost = Math.round(totalCost * 100) / 100;
    totalRetail = Math.round(totalRetail * 100) / 100;

    const potentialMargin = totalRetail > 0
      ? parseFloat((((totalRetail - totalCost) / totalRetail) * 100).toFixed(2))
      : 0;

    return {
      generatedAt: new Date(),
      branchId,
      totalSKUs: (lines || []).length,
      totalUnits,
      totalValueAtCost: totalCost,
      totalValueAtRetail: totalRetail,
      potentialMargin,
      lines: lines || [],
    };
  }

  async getLowStockAlerts(branchId?: string, reorderPoint = DEFAULT_REORDER_POINT, limit = 50): Promise<LowStockAlert[]> {
    let warehouseCondition = Prisma.empty;
    if (branchId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { branchId },
        select: { id: true },
      });
      const warehouseIds = warehouses.map(w => w.id);
      if (warehouseIds.length > 0) {
        warehouseCondition = Prisma.sql`AND sl."warehouseId" IN (${Prisma.join(warehouseIds)})`;
      }
    }

    const rows: Array<{
      variantId: string;
      sku: string;
      name: string;
      branchId: string;
      availableQuantity: number;
      reorderPoint: number;
    }> = await this.prisma.$queryRaw`
      SELECT 
        sl."variantId",
        COALESCE(pv.sku, 'Unknown') AS sku,
        COALESCE(p.name, 'Unknown') AS name,
        COALESCE(sl."branchId", ${branchId || ''}) AS "branchId",
        sl."availableQuantity"::int AS "availableQuantity",
        ${reorderPoint}::int AS "reorderPoint"
      FROM "inventory"."StockLevel" sl
      JOIN "catalog"."ProductVariant" pv ON pv.id = sl."variantId"
      LEFT JOIN "catalog"."Product" p ON p.id = pv."productId"
      WHERE sl."availableQuantity" <= ${reorderPoint}
        ${warehouseCondition}
      ORDER BY sl."availableQuantity" ASC
      LIMIT ${limit};
    `;

    return (rows || []).map(r => ({
      variantId: r.variantId,
      sku: r.sku,
      name: r.name,
      branchId: r.branchId || branchId || 'General',
      availableQuantity: Number(r.availableQuantity),
      reorderPoint: Number(r.reorderPoint),
    }));
  }
}
