import { Module } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [SalesReportService, StockReportService, DashboardService],
  exports: [SalesReportService, StockReportService, DashboardService],
})
export class ReportsModule {}
