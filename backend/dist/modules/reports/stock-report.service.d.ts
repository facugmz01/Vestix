import { PrismaService } from '../../core/prisma/prisma.service';
import { StockValuationReport, LowStockAlert } from './models/report.model';
export declare class StockReportService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getStockValuation(branchId?: string): Promise<StockValuationReport>;
    getLowStockAlerts(branchId?: string, reorderPoint?: number, limit?: number): Promise<LowStockAlert[]>;
}
