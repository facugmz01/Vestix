import { Module } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { ReportsController } from './reports.controller';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';

@Module({
  controllers: [ReportsController],
  providers: [SalesReportService, StockReportService, DashboardService, CashReportService, PurchasesReportService],
  exports: [SalesReportService, StockReportService, DashboardService, CashReportService, PurchasesReportService],
})
export class ReportsModule {}
