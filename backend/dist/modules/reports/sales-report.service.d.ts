import { PrismaService } from '../../core/prisma/prisma.service';
import { DateRangeFilter, SalesSummaryReport, TopSellingVariant, CogsReport } from './models/report.model';
export declare class SalesReportService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getSalesSummary(filter: DateRangeFilter): Promise<SalesSummaryReport>;
    getTopSellers(filter: DateRangeFilter, limit?: number): Promise<TopSellingVariant[]>;
    getCogsReport(filter: DateRangeFilter, precomputedRevenue?: number): Promise<CogsReport>;
}
