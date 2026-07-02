import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';
export declare class ReportsController {
    private readonly salesReport;
    private readonly stockReport;
    private readonly dashboardService;
    private readonly cashReport;
    private readonly purchasesReport;
    constructor(salesReport: SalesReportService, stockReport: StockReportService, dashboardService: DashboardService, cashReport: CashReportService, purchasesReport: PurchasesReportService);
    private parseDate;
    private getDefaultFrom;
    getDashboard(branchId?: string): Promise<import("./models/report.model").DashboardSummary>;
    getSalesSummary(from: string, to: string, branchId?: string): Promise<import("./models/report.model").SalesSummaryReport>;
    getTopSellers(from: string, to: string): Promise<import("./models/report.model").TopSellingVariant[]>;
    getCogsReport(from: string, to: string): Promise<import("./models/report.model").CogsReport>;
    getStockValuation(branchId?: string): Promise<import("./models/report.model").StockValuationReport>;
    getLowStockAlerts(branchId?: string, reorderPoint?: string): Promise<import("./models/report.model").LowStockAlert[]>;
    getPurchasesSummary(from: string, to: string, branchId?: string): Promise<import("./purchases-report.service").PurchasesSummaryReport>;
    getCashSummary(from: string, to: string, branchId?: string): Promise<import("./cash-report.service").CashSummaryReport>;
    exportReport(body: any): {
        downloadUrl: string;
    };
}
