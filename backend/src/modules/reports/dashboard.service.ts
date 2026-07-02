import { Injectable, Logger } from '@nestjs/common';
import { DashboardSummary } from './models/report.model';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Date Helpers ─────────────────────────────────────────────────────────

  private buildTodayRange() {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    return { from, to: new Date() };
  }

  private buildMonthRange() {
    const to = new Date();
    const from = new Date(to.getFullYear(), to.getMonth(), 1);
    return { from, to };
  }

  // ─── Main Method ──────────────────────────────────────────────────────────

  /**
   * MANAGEMENT DASHBOARD
   * Aggregates all KPIs into a single endpoint response, minimizing round-trips
   * from the frontend. Designed for the admin panel's "Overview" screen.
   *
   * Queries are grouped into two parallel batches:
   *   Batch A: Sales data (today + month + topSellers) — all hit the same tables
   *   Batch B: Stock alerts + pending orders count — independent reads
   *
   * This avoids the connection pool exhaustion of full Promise.all(6),
   * while keeping latency lower than fully sequential execution.
   */
  async getDashboard(branchId?: string): Promise<DashboardSummary> {
    const t0 = Date.now();
    const today = this.buildTodayRange();
    const month = this.buildMonthRange();

    // ── Batch A: Sales-related queries (same table set) ──────────────────────
    const [todaySales, monthSales, topSellers] = await Promise.all([
      this.salesReport.getSalesSummary({ from: today.from, to: today.to, branchId }),
      this.salesReport.getSalesSummary({ from: month.from, to: month.to, branchId }),
      this.salesReport.getTopSellers({ from: month.from, to: month.to, branchId }, 5),
    ]);

    // ── Batch B: Stock + orders (independent of sales tables) ────────────────
    // Pass monthSales.netRevenue to COGS to avoid an internal double-query.
    const [lowStockAlerts, monthCogs, pendingOrders] = await Promise.all([
      this.stockReport.getLowStockAlerts(branchId),
      this.salesReport.getCogsReport(
        { from: month.from, to: month.to, branchId },
        monthSales.netRevenue,
      ),
      this.prisma.saleOrder.count({
        where: { status: { in: ['PENDING', 'PROCESSING', 'PAID'] } },
      }),
    ]);

    this.logger.log(`[Dashboard] Resolved in ${Date.now() - t0}ms${branchId ? ` (branch: ${branchId})` : ''}`);

    return {
      generatedAt: today.to,
      today: {
        revenue:        todaySales.netRevenue,
        orders:         todaySales.totalOrders,
        avgOrderValue:  todaySales.averageOrderValue,
        cashInDrawers:  todaySales.byPaymentMethod.find(m => m.method === 'CASH')?.amount ?? 0,
      },
      thisMonth: {
        revenue:        monthSales.netRevenue,
        orders:         monthSales.totalOrders,
        grossMarginPct: monthCogs.grossMarginPct,
      },
      topSellers,
      lowStockAlerts,
      pendingOrders,
    };
  }
}
