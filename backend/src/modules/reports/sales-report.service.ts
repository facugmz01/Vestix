import { Injectable, Logger } from '@nestjs/common';
import {
  DateRangeFilter,
  SalesSummaryReport,
  TopSellingVariant,
  CogsReport,
} from './models/report.model';

@Injectable()
export class SalesReportService {
  private readonly logger = new Logger(SalesReportService.name);

  /**
   * SALES SUMMARY
   * High-level financial overview for a period (Day, Week, Month, Custom).
   * In production, this executes a single optimized PostgreSQL aggregation query:
   *
   * SELECT
   *   COUNT(*) AS total_orders,
   *   SUM(grand_total) AS total_revenue,
   *   SUM(cart_discount_total) AS total_discounts,
   *   AVG(grand_total) AS avg_order_value
   * FROM sale_orders
   * WHERE created_at BETWEEN :from AND :to
   *   AND branch_id = :branchId
   */
  async getSalesSummary(filter: DateRangeFilter): Promise<SalesSummaryReport> {
    this.logger.log(`[SalesReport] Summary requested: ${filter.from.toISOString()} → ${filter.to.toISOString()}`);

    // MOCK: Hardcoded shape. Production replaces with a Prisma aggregate query.
    return {
      period: { from: filter.from, to: filter.to },
      totalOrders: 340,
      totalRevenue: 128000,
      totalDiscounts: 9500,
      netRevenue: 118500,
      averageOrderValue: 376.47,
      byPaymentMethod: {
        CASH: 52000,
        CREDIT_CARD: 47000,
        CUSTOMER_CREDIT: 19500,
      },
      byChannel: {
        POS: 89000,
        ECOMMERCE: 39000,
      },
    };
  }

  /**
   * TOP SELLERS
   * Units sold and revenue per variant over a period.
   * In production:
   *   SELECT variant_id, SUM(quantity) AS units_sold, SUM(final_price * quantity) AS revenue
   *   FROM order_line_items JOIN sale_orders ON ...
   *   WHERE sale_orders.created_at BETWEEN :from AND :to
   *   GROUP BY variant_id
   *   ORDER BY units_sold DESC LIMIT 20
   */
  async getTopSellers(filter: DateRangeFilter, limit = 10): Promise<TopSellingVariant[]> {
    return [
      { variantId: 'v1', name: 'Premium T-Shirt / M / Black', sku: 'TSH-PRM-M-BLK', totalUnitsSold: 87, totalRevenue: 1740 },
      { variantId: 'v2', name: 'Winter Jacket / L / Navy', sku: 'JKT-WIN-L-NVY', totalUnitsSold: 34, totalRevenue: 4080 },
      { variantId: 'v3', name: 'Skinny Jeans / 32 / Blue', sku: 'JNS-SKN-32-BLU', totalUnitsSold: 61, totalRevenue: 3050 },
    ].slice(0, limit);
  }

  /**
   * COGS REPORT (Cost of Goods Sold)
   * Leverages the unitCost stamped on every InventoryMovement during goods receipt.
   * Critical for gross margin calculation and P&L statements.
   *
   * In production:
   *   SELECT SUM(quantity * unit_cost) AS cogs
   *   FROM inventory_movements
   *   WHERE type = 'SALE' AND created_at BETWEEN :from AND :to
   */
  async getCogsReport(filter: DateRangeFilter): Promise<CogsReport> {
    const totalCOGS = 74000;
    const totalRevenue = 118500;
    const grossProfit = totalRevenue - totalCOGS;

    return {
      period: { from: filter.from, to: filter.to },
      totalCOGS,
      totalRevenue,
      grossProfit,
      grossMarginPct: parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)),
    };
  }
}
