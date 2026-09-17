import { Controller, Get, Post, Query, Body, Param, UseGuards } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { ReportExportService } from './report-export.service';
import { LibroIvaService } from './libro-iva.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';
import { toStartOfDayArgentina, toEndOfDayArgentina } from './utils/report-date.util';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly dashboardService: DashboardService,
    private readonly cashReport: CashReportService,
    private readonly purchasesReport: PurchasesReportService,
    private readonly reportExport: ReportExportService,
    private readonly libroIvaService: LibroIvaService,
  ) {}

  @Get('dashboard')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getDashboard(@Query('branchId') branchId?: string) {
    return this.dashboardService.getDashboard(branchId || undefined);
  }

  @Get('sales/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getSalesSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesReport.getSalesSummary({ 
      from: toStartOfDayArgentina(from), 
      to: toEndOfDayArgentina(to), 
      branchId: branchId || undefined,
    });
  }

  @Get('sales/top-sellers')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getTopSellers(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.salesReport.getTopSellers(
      { 
        from: toStartOfDayArgentina(from), 
        to: toEndOfDayArgentina(to),
        branchId: branchId || undefined,
      },
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('sales/cogs')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getCogsReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesReport.getCogsReport({ 
      from: toStartOfDayArgentina(from), 
      to: toEndOfDayArgentina(to),
      branchId: branchId || undefined,
    });
  }

  @Get('stock/valuation')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getStockValuation(@Query('branchId') branchId?: string) {
    return this.stockReport.getStockValuation(branchId || undefined);
  }

  @Get('stock/low-stock')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getLowStockAlerts(
    @Query('branchId') branchId?: string,
    @Query('reorderPoint') reorderPoint?: string,
  ) {
    return this.stockReport.getLowStockAlerts(
      branchId || undefined,
      reorderPoint ? parseInt(reorderPoint, 10) : undefined,
    );
  }

  @Get('purchases/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getPurchasesSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.purchasesReport.getPurchasesSummary({ 
      from: toStartOfDayArgentina(from), 
      to: toEndOfDayArgentina(to),
      branchId: branchId || undefined,
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
      from: toStartOfDayArgentina(from), 
      to: toEndOfDayArgentina(to), 
      branchId: branchId || undefined,
    });
  }

  @Get('libro-iva/ventas')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getLibroIvaVentas(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.libroIvaService.getVentas({
      from: toStartOfDayArgentina(from),
      to: toEndOfDayArgentina(to),
    });
  }

  @Get('libro-iva/compras')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getLibroIvaCompras(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.libroIvaService.getCompras({
      from: toStartOfDayArgentina(from),
      to: toEndOfDayArgentina(to),
    });
  }

  @Post('export/:type')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  exportReport(@Param('type') type: string, @Body() body: Record<string, string>) {
    return this.reportExport.export(type, body);
  }
}
