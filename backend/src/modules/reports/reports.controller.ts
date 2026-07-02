import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly dashboardService: DashboardService,
    private readonly cashReport: CashReportService,
    private readonly purchasesReport: PurchasesReportService,
  ) {}

  private parseDate(val: string, fallback: Date): Date {
    if (!val) return fallback;
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d;
  }

  private getDefaultFrom(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  }

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
    return this.salesReport.getSalesSummary({ 
      from: this.parseDate(from, this.getDefaultFrom()), 
      to: this.parseDate(to, new Date()), 
      branchId 
    });
  }

  @Get('sales/top-sellers')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getTopSellers(@Query('from') from: string, @Query('to') to: string) {
    return this.salesReport.getTopSellers({ 
      from: this.parseDate(from, this.getDefaultFrom()), 
      to: this.parseDate(to, new Date()) 
    });
  }

  @Get('sales/cogs')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getCogsReport(@Query('from') from: string, @Query('to') to: string) {
    return this.salesReport.getCogsReport({ 
      from: this.parseDate(from, this.getDefaultFrom()), 
      to: this.parseDate(to, new Date()) 
    });
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

  @Get('purchases/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getPurchasesSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.purchasesReport.getPurchasesSummary({ 
      from: this.parseDate(from, this.getDefaultFrom()), 
      to: this.parseDate(to, new Date()) 
    });
  }

  @Get('cash/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getCashSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.cashReport.getCashSummary({ 
      from: this.parseDate(from, this.getDefaultFrom()), 
      to: this.parseDate(to, new Date()), 
      branchId 
    });
  }

  @Post('export/:type')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  exportReport(@Body() body: any) {
    return { downloadUrl: `data:text/csv;charset=utf-8,Col1,Col2\nVal1,Val2` };
  }
}
