import { DashboardSummary } from './models/report.model';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
export declare class DashboardService {
    private readonly salesReport;
    private readonly stockReport;
    constructor(salesReport: SalesReportService, stockReport: StockReportService);
    getDashboard(branchId?: string): Promise<DashboardSummary>;
}
