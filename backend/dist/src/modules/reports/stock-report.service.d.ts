import { StockValuationReport, LowStockAlert } from './models/report.model';
export declare class StockReportService {
    private readonly logger;
    getStockValuation(branchId?: string): Promise<StockValuationReport>;
    getLowStockAlerts(branchId?: string, reorderPoint?: number): Promise<LowStockAlert[]>;
}
