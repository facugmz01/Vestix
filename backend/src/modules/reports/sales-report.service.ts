import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  DateRangeFilter,
  SalesSummaryReport,
  TopSellingVariant,
  CogsReport,
} from './models/report.model';
import { REVENUE_ELIGIBLE_STATUSES } from './report.constants';

@Injectable()
export class SalesReportService {
  private readonly logger = new Logger(SalesReportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Summarises sales KPIs using database-native aggregations.
   * Completely avoids pulling large collections into application memory.
   */
  async getSalesSummary(filter: DateRangeFilter): Promise<SalesSummaryReport> {
    this.logger.log(`[SalesReport] Summary requested: ${filter.from.toISOString()} -> ${filter.to.toISOString()}${filter.branchId ? ` (branch: ${filter.branchId})` : ''}`);

    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};

    // 1. Database-level aggregation for orders and returns
    const [orderAgg, returnAgg] = await Promise.all([
      this.prisma.saleOrder.aggregate({
        _count: { id: true },
        _sum: {
          subtotal: true,
          cartDiscountTotal: true,
          grandTotal: true,
        },
        where: {
          createdAt: { gte: filter.from, lte: filter.to },
          status: { in: [...REVENUE_ELIGIBLE_STATUSES] },
          ...branchFilter,
        },
      }),
      this.prisma.saleReturn.aggregate({
        _sum: {
          totalRefundAmount: true,
        },
        where: {
          createdAt: { gte: filter.from, lte: filter.to },
          status: 'APPROVED',
          ...branchFilter,
        },
      }),
    ]);

    const totalOrders = orderAgg._count.id || 0;
    const totalRevenue = orderAgg._sum.subtotal || 0;
    const totalDiscounts = orderAgg._sum.cartDiscountTotal || 0;
    const totalGrand = orderAgg._sum.grandTotal || 0;
    const totalRefunds = returnAgg._sum.totalRefundAmount || 0;

    // Ventas Netas = Total Facturado menos descuentos y devoluciones (SaleReturn)
    const netRevenue = Math.max(0, Math.round((totalGrand - totalRefunds) * 100) / 100);
    const averageOrderValue = totalOrders > 0 ? Math.round((netRevenue / totalOrders) * 100) / 100 : 0;

    // 2. Breakdown by Payment Method via SQL aggregation
    const branchSql = filter.branchId
      ? Prisma.sql`AND so."branchId" = ${filter.branchId}`
      : Prisma.empty;

    const paymentRows: Array<{ method: string; count: number; amount: number }> = await this.prisma.$queryRaw`
      WITH split_payments AS (
        SELECT 
          COALESCE(pm.type, pm.name, 'UNKNOWN') AS method,
          COUNT(sop.id)::int AS count,
          SUM(sop.amount)::float AS amount
        FROM "sales"."SaleOrderPayment" sop
        JOIN "sales"."SaleOrder" so ON so.id = sop."orderId"
        LEFT JOIN "finance"."PaymentMethod" pm ON pm.id = sop."paymentMethodId"
        WHERE so.status IN (${Prisma.join([...REVENUE_ELIGIBLE_STATUSES])})
          AND so."createdAt" >= ${filter.from} AND so."createdAt" <= ${filter.to}
          ${branchSql}
        GROUP BY COALESCE(pm.type, pm.name, 'UNKNOWN')
      ),
      legacy_payments AS (
        SELECT 
          COALESCE(so."paymentMethod", 'UNKNOWN') AS method,
          COUNT(so.id)::int AS count,
          SUM(so."grandTotal")::float AS amount
        FROM "sales"."SaleOrder" so
        WHERE so.status IN (${Prisma.join([...REVENUE_ELIGIBLE_STATUSES])})
          AND so."createdAt" >= ${filter.from} AND so."createdAt" <= ${filter.to}
          ${branchSql}
          AND NOT EXISTS (
            SELECT 1 FROM "sales"."SaleOrderPayment" sop WHERE sop."orderId" = so.id
          )
        GROUP BY COALESCE(so."paymentMethod", 'UNKNOWN')
      )
      SELECT method, SUM(count)::int AS count, ROUND(SUM(amount)::numeric, 2)::float AS amount
      FROM (
        SELECT * FROM split_payments
        UNION ALL
        SELECT * FROM legacy_payments
      ) combined
      GROUP BY method
      ORDER BY amount DESC;
    `;

    const byPaymentMethod = (paymentRows || []).map(r => ({
      method: r.method,
      count: Number(r.count),
      amount: Number(r.amount),
    }));

    // 3. Breakdown by Channel (source)
    const channelGroups = await this.prisma.saleOrder.groupBy({
      by: ['source'],
      _sum: { grandTotal: true },
      where: {
        createdAt: { gte: filter.from, lte: filter.to },
        status: { in: [...REVENUE_ELIGIBLE_STATUSES] },
        ...branchFilter,
      },
    });

    const byChannel: Record<string, number> = {};
    for (const group of channelGroups) {
      const channel = group.source || 'POS';
      byChannel[channel] = Math.round((group._sum.grandTotal || 0) * 100) / 100;
    }

    return {
      period: { from: filter.from, to: filter.to },
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalDiscounts: Math.round(totalDiscounts * 100) / 100,
      netRevenue,
      averageOrderValue,
      byPaymentMethod,
      byChannel,
    };
  }

  /**
   * Top selling variants aggregated directly in PostgreSQL.
   * Multiplies quantity * finalPrice and accurately deducts net returns.
   */
  async getTopSellers(filter: DateRangeFilter, limit = 10): Promise<TopSellingVariant[]> {
    const branchSql = filter.branchId
      ? Prisma.sql`AND so."branchId" = ${filter.branchId}`
      : Prisma.empty;
    const returnBranchSql = filter.branchId
      ? Prisma.sql`AND sr."branchId" = ${filter.branchId}`
      : Prisma.empty;

    const rows: Array<{
      variantId: string;
      sku: string;
      name: string;
      category: string;
      totalUnitsSold: number;
      totalRevenue: number;
    }> = await this.prisma.$queryRaw`
      WITH sold_lines AS (
        SELECT 
          oli."variantId",
          oli."categoryId",
          SUM(oli.quantity)::int AS sold_units,
          SUM(oli.quantity * oli."finalPrice")::float AS sold_revenue,
          MAX(oli."historicalSku") AS hist_sku,
          MAX(oli."historicalName") AS hist_name
        FROM "sales"."OrderLineItem" oli
        JOIN "sales"."SaleOrder" so ON so.id = oli."orderId"
        WHERE so.status IN (${Prisma.join([...REVENUE_ELIGIBLE_STATUSES])})
          AND so."createdAt" >= ${filter.from} AND so."createdAt" <= ${filter.to}
          ${branchSql}
        GROUP BY oli."variantId", oli."categoryId"
      ),
      returned_lines AS (
        SELECT 
          srl."variantId",
          SUM(srl.quantity)::int AS returned_units,
          SUM(srl.quantity * srl."unitPrice")::float AS returned_revenue
        FROM "sales"."SaleReturnLine" srl
        JOIN "sales"."SaleReturn" sr ON sr.id = srl."returnId"
        WHERE sr.status = 'APPROVED'
          AND sr."createdAt" >= ${filter.from} AND sr."createdAt" <= ${filter.to}
          ${returnBranchSql}
        GROUP BY srl."variantId"
      )
      SELECT 
        sl."variantId",
        COALESCE(pv.sku, sl.hist_sku, 'Sin SKU') AS sku,
        COALESCE(p.name, sl.hist_name, 'Producto') AS name,
        COALESCE(c.name, 'General') AS category,
        (sl.sold_units - COALESCE(rl.returned_units, 0))::int AS "totalUnitsSold",
        ROUND((sl.sold_revenue - COALESCE(rl.returned_revenue, 0))::numeric, 2)::float AS "totalRevenue"
      FROM sold_lines sl
      LEFT JOIN returned_lines rl ON rl."variantId" = sl."variantId"
      LEFT JOIN "catalog"."ProductVariant" pv ON pv.id = sl."variantId"
      LEFT JOIN "catalog"."Product" p ON p.id = pv."productId"
      LEFT JOIN "catalog"."Category" c ON c.id = COALESCE(p."categoryId", sl."categoryId")
      WHERE (sl.sold_units - COALESCE(rl.returned_units, 0)) > 0
      ORDER BY "totalUnitsSold" DESC, "totalRevenue" DESC
      LIMIT ${limit};
    `;

    return (rows || []).map(r => ({
      variantId: r.variantId,
      sku: r.sku,
      name: r.name,
      category: r.category,
      totalUnitsSold: Number(r.totalUnitsSold),
      totalRevenue: Number(r.totalRevenue),
    }));
  }

  /**
   * Cost of Goods Sold (CMV) and Gross Margin report.
   * Leverages inventory movements (SALE vs SALE_RETURN) or falls back to line item costs.
   */
  async getCogsReport(filter: DateRangeFilter, precomputedRevenue?: number): Promise<CogsReport> {
    let warehouseCondition = Prisma.empty;
    if (filter.branchId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { branchId: filter.branchId },
        select: { id: true },
      });
      const warehouseIds = warehouses.map(w => w.id);
      if (warehouseIds.length > 0) {
        warehouseCondition = Prisma.sql`AND (im."sourceWarehouseId" IN (${Prisma.join(warehouseIds)}) OR im."destinationWarehouseId" IN (${Prisma.join(warehouseIds)}))`;
      }
    }

    const cogsResult: Array<{ totalCOGS: number }> = await this.prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN im.type = 'SALE' THEN (im.quantity * im."unitCost")
            WHEN im.type = 'SALE_RETURN' THEN -(im.quantity * im."unitCost")
            ELSE 0 
          END
        ), 0)::float AS "totalCOGS"
      FROM "inventory"."InventoryMovement" im
      WHERE im.type IN ('SALE', 'SALE_RETURN')
        AND im."createdAt" >= ${filter.from} AND im."createdAt" <= ${filter.to}
        ${warehouseCondition};
    `;

    let totalCOGS = Math.max(0, cogsResult[0]?.totalCOGS || 0);

    // Fallback: If no inventory movements were recorded yet for this range, compute from order line items
    if (totalCOGS === 0) {
      const branchSql = filter.branchId ? Prisma.sql`AND so."branchId" = ${filter.branchId}` : Prisma.empty;
      const lineCogsResult: Array<{ lineCOGS: number }> = await this.prisma.$queryRaw`
        SELECT 
          COALESCE(SUM(oli.quantity * COALESCE(oli."historicalCost", pv."costPrice", 0)), 0)::float AS "lineCOGS"
        FROM "sales"."OrderLineItem" oli
        JOIN "sales"."SaleOrder" so ON so.id = oli."orderId"
        LEFT JOIN "catalog"."ProductVariant" pv ON pv.id = oli."variantId"
        WHERE so.status IN (${Prisma.join([...REVENUE_ELIGIBLE_STATUSES])})
          AND so."createdAt" >= ${filter.from} AND so."createdAt" <= ${filter.to}
          ${branchSql};
      `;
      totalCOGS = Math.max(0, lineCogsResult[0]?.lineCOGS || 0);
    }

    totalCOGS = Math.round(totalCOGS * 100) / 100;

    const totalRevenue = precomputedRevenue !== undefined
      ? precomputedRevenue
      : (await this.getSalesSummary(filter)).netRevenue;

    const grossProfit = Math.round((totalRevenue - totalCOGS) * 100) / 100;
    const grossMarginPct = totalRevenue > 0
      ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2))
      : 0;

    return {
      period: { from: filter.from, to: filter.to },
      totalCOGS,
      totalRevenue,
      grossProfit,
      grossMarginPct,
    };
  }
}
