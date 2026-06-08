import { CashShift } from './models/cash-register.model';
import { AccountsService } from '../accounts.service';
export declare class CashService {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    private shifts;
    openShift(accountId: string, userId: string, reportedOpeningBalance: number): Promise<CashShift>;
    recordExpense(accountId: string, amount: number, description: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    performCashDrop(sourceAccountId: string, destinationAccountId: string, amount: number, userId: string): Promise<{
        success: boolean;
        amount: number;
    }>;
    closeShift(accountId: string, userId: string, actualCountedBalance: number): Promise<CashShift>;
    private ensureShiftIsOpen;
}
