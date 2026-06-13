import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountsService } from '../accounts.service';
export declare class CashService {
    private readonly prisma;
    private readonly accountsService;
    constructor(prisma: PrismaService, accountsService: AccountsService);
    getActiveShift(cashRegisterId: string): Promise<{
        openedByUser: {
            id: string;
            email: string;
            fullName: string;
        };
    } & {
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    getActiveShiftForUser(userId: string): Promise<{
        openedByUser: {
            id: string;
            email: string;
            fullName: string;
        };
    } & {
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    openShift(cashRegisterId: string, userId: string, reportedOpeningBalance: number): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    closeShift(shiftId: string, userId: string, actualCountedBalance: number, notes?: string): Promise<{
        id: string;
        cashRegisterId: string;
        openedByUserId: string;
        closedByUserId: string | null;
        openingAmount: number;
        closingAmount: number | null;
        expectedAmount: number | null;
        difference: number | null;
        status: string;
        openedAt: Date;
        closedAt: Date | null;
        notes: string | null;
    }>;
    recordExpense(accountId: string, amount: number, description: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    performCashDrop(sourceAccountId: string, destinationAccountId: string, amount: number, userId: string): Promise<{
        success: boolean;
        amount: number;
    }>;
}
