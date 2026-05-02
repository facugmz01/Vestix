import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
export declare class ReportsController {
    private readonly salesReport;
    private readonly stockReport;
    private readonly dashboardService;
    constructor(salesReport: SalesReportService, stockReport: StockReportService, dashboardService: DashboardService);
    getDashboard(branchId?: string): Promise<import("./models/report.model").DashboardSummary>;
    getSalesSummary(from: string, to: string, branchId?: string): Promise<import("./models/report.model").SalesSummaryReport>;
    getTopSellers(from: string, to: string): Promise<import("./models/report.model").TopSellingVariant[]>;
    getCogsReport(from: string, to: string): Promise<import("./models/report.model").CogsReport>;
    getStockValuation(branchId?: string): Promise<import("./models/report.model").StockValuationReport>;
    getLowStockAlerts(branchId?: string, reorderPoint?: string): Promise<import("./models/report.model").LowStockAlert[]>;
}
