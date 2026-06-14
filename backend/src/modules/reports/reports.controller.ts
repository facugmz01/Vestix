import { Controller, Get, Post, Query, Body, Res } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { RequirePermissions } from '../../core/rbac/decorators/require-permissions.decorator';
import { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly dashboardService: DashboardService,
    private readonly cashReport: CashReportService,
    private readonly purchasesReport: PurchasesReportService,
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

  @Get('purchases/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getPurchasesSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    // Note: branchId is available in the DTO but not strictly used in current service if it's not filtered, we pass what we have
    return this.purchasesReport.getPurchasesSummary({ from: new Date(from), to: new Date(to) });
  }

  @Get('cash/summary')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  getCashSummary(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.cashReport.getCashSummary({ from: new Date(from), to: new Date(to), branchId });
  }

  @Post('export/:type')
  @RequirePermissions({ action: 'read', subject: 'Reports' })
  exportReport(@Body() body: any) {
    // Para simplificar, devolvemos un string en base64 o similar.
    // Opcionalmente generar CSV real. Devuelve link ficticio para UX solicitada.
    return { downloadUrl: `data:text/csv;charset=utf-8,Col1,Col2\nVal1,Val2` };
  }
}
