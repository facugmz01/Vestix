import { Injectable, Logger } from '@nestjs/common';
import { DashboardSummary } from './models/report.model';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { CashReportService } from './cash-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { getPresetDateRange } from './utils/report-date.util';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly purchasesReport: PurchasesReportService,
    private readonly cashReport: CashReportService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * MANAGEMENT DASHBOARD
   * Includes ventas, compras, deuda proveedores y egresos/ingresos de tesorería.
   * Ranges are strictly bounded to Argentina time (America/Argentina/Buenos_Aires, UTC-3).
   */
  async getDashboard(branchId?: string): Promise<DashboardSummary> {
    const t0 = Date.now();
    const today = getPresetDateRange('today');
    const month = getPresetDateRange('month');

    const [
      todaySales,
      monthSales,
      topSellers,
      lowStockAlerts,
      pendingOrders,
      todayPurchases,
      monthPurchases,
      todayCash,
      monthCash,
      cashAccounts,
      supplierDebtAgg,
    ] = await Promise.all([
      this.salesReport.getSalesSummary({ from: today.from, to: today.to, branchId }),
      this.salesReport.getSalesSummary({ from: month.from, to: month.to, branchId }),
      this.salesReport.getTopSellers({ from: month.from, to: month.to, branchId }, 5),
      this.stockReport.getLowStockAlerts(branchId),
      this.prisma.saleOrder.count({
        where: {
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
          ...(branchId ? { branchId } : {}),
        },
      }),
      this.purchasesReport.getPurchasesSummary({ from: today.from, to: today.to, branchId }),
      this.purchasesReport.getPurchasesSummary({ from: month.from, to: month.to, branchId }),
      this.cashReport.getCashSummary({ from: today.from, to: today.to, branchId }),
      this.cashReport.getCashSummary({ from: month.from, to: month.to, branchId }),
      this.prisma.financialAccount.findMany({
        where: {
          isActive: true,
          type: 'CASH',
          ...(branchId ? { branchId } : {}),
        },
        select: { balance: true },
      }),
      this.prisma.supplier.aggregate({
        _sum: { balance: true },
      }),
    ]);

    const monthCogsResolved = await this.salesReport.getCogsReport(
      { from: month.from, to: month.to, branchId },
      monthSales.netRevenue,
    );

    const cashInDrawers = cashAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    this.logger.log(`[Dashboard] Resolved in ${Date.now() - t0}ms${branchId ? ` (branch: ${branchId})` : ''}`);

    return {
      generatedAt: today.to,
      today: {
        revenue: todaySales.netRevenue,
        orders: todaySales.totalOrders,
        avgOrderValue: todaySales.averageOrderValue,
        cashInDrawers,
        purchasesTotal: todayPurchases.totalAmount,
        supplierPayments: todayCash.totalExpenses,
      },
      thisMonth: {
        revenue: monthSales.netRevenue,
        orders: monthSales.totalOrders,
        grossMarginPct: monthCogsResolved.grossMarginPct,
        purchasesTotal: monthPurchases.totalAmount,
        purchasesPaid: monthPurchases.totalReceived,
        purchasesDebt: monthPurchases.pendingAmount,
        cashIncome: monthCash.totalIncome,
        cashExpenses: monthCash.totalExpenses,
        netCash: monthCash.netCash,
      },
      supplierPayableBalance: supplierDebtAgg._sum.balance || 0,
      topSellers,
      lowStockAlerts,
      pendingOrders,
    };
  }
}
