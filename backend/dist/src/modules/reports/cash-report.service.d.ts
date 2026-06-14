import { PrismaService } from '../../core/prisma/prisma.service';
export interface CashSummaryReport {
    period: {
        from: Date;
        to: Date;
    };
    totalIncome: number;
    totalExpenses: number;
    netCash: number;
    byMethod: {
        method: string;
        amount: number;
    }[];
    dailySeries: {
        date: string;
        income: number;
        expenses: number;
    }[];
}
export declare class CashReportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCashSummary(params: {
        from: Date;
        to: Date;
        branchId?: string;
    }): Promise<CashSummaryReport>;
}
