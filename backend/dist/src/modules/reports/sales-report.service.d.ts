import { DateRangeFilter, SalesSummaryReport, TopSellingVariant, CogsReport } from './models/report.model';
export declare class SalesReportService {
    private readonly logger;
    getSalesSummary(filter: DateRangeFilter): Promise<SalesSummaryReport>;
    getTopSellers(filter: DateRangeFilter, limit?: number): Promise<TopSellingVariant[]>;
    getCogsReport(filter: DateRangeFilter): Promise<CogsReport>;
}
