import { DashboardSummary } from './models/report.model';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class DashboardService {
    private readonly salesReport;
    private readonly stockReport;
    private readonly prisma;
    private readonly logger;
    constructor(salesReport: SalesReportService, stockReport: StockReportService, prisma: PrismaService);
    private buildTodayRange;
    private buildMonthRange;
    getDashboard(branchId?: string): Promise<DashboardSummary>;
}
