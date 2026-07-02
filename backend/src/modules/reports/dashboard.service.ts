import { Injectable } from '@nestjs/common';
import { DashboardSummary } from './models/report.model';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * MANAGEMENT DASHBOARD
   * Aggregates all KPIs into a single response, minimizing round-trips from the frontend.
   * Designed for the admin panel's "Overview" screen.
   *
   * In production, this is backed by a Redis-cached response
   * invalidated every 5 minutes or on significant events (checkout, stock receipt).
   */
  async getDashboard(branchId?: string): Promise<DashboardSummary> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const now = new Date();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run sequentially to prevent Prisma connection pool exhaustion in production
    const todaySales = await this.salesReport.getSalesSummary({ from: todayStart, to: now, branchId });
    const monthSales = await this.salesReport.getSalesSummary({ from: monthStart, to: now, branchId });
    const topSellers = await this.salesReport.getTopSellers({ from: monthStart, to: now, branchId }, 5);
    const lowStockAlerts = await this.stockReport.getLowStockAlerts(branchId);
    const monthCogs = await this.salesReport.getCogsReport({ from: monthStart, to: now, branchId });
    const pendingOrders = await this.prisma.saleOrder.count({
      where: {
        status: { in: ['PENDING', 'PROCESSING', 'PAID'] } // Adjust according to logic
      }
    });

    return {
      generatedAt: now,
      today: {
        revenue: todaySales.netRevenue,
        orders: todaySales.totalOrders,
        avgOrderValue: todaySales.averageOrderValue,
        cashInDrawers: todaySales.byPaymentMethod.find(m => m.method === 'CASH')?.amount ?? 0,
      },
      thisMonth: {
        revenue: monthSales.netRevenue,
        orders: monthSales.totalOrders,
        grossMarginPct: monthCogs.grossMarginPct,
      },
      topSellers,
      lowStockAlerts,
      pendingOrders,
    };
  }
}
