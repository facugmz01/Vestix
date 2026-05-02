import { Controller, Get, Query } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('dashboard')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getDashboard(@Query('branchId') branchId?: string) {
    return this.dashboardService.getDashboard(branchId);
  }

  @Get('sales/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getSalesSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesReport.getSalesSummary({ from: new Date(from), to: new Date(to), branchId });
  }

  @Get('sales/top-sellers')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getTopSellers(@Query('from') from: string, @Query('to') to: string) {
    return this.salesReport.getTopSellers({ from: new Date(from), to: new Date(to) });
  }

  @Get('sales/cogs')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getCogsReport(@Query('from') from: string, @Query('to') to: string) {
    return this.salesReport.getCogsReport({ from: new Date(from), to: new Date(to) });
  }

  @Get('stock/valuation')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getStockValuation(@Query('branchId') branchId?: string) {
    return this.stockReport.getStockValuation(branchId);
  }

  @Get('stock/low-stock')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getLowStockAlerts(@Query('branchId') branchId?: string, @Query('reorderPoint') reorderPoint?: string) {
    return this.stockReport.getLowStockAlerts(branchId, reorderPoint ? parseInt(reorderPoint) : undefined);
  }
}
