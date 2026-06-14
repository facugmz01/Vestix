import { PrismaService } from '../../core/prisma/prisma.service';
export interface PurchasesSummaryReport {
    period: {
        from: Date;
        to: Date;
    };
    totalOrders: number;
    totalAmount: number;
    totalReceived: number;
    pendingAmount: number;
    topSuppliers: {
        supplierName: string;
        totalAmount: number;
    }[];
}
export declare class PurchasesReportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPurchasesSummary(params: {
        from: Date;
        to: Date;
    }): Promise<PurchasesSummaryReport>;
}
