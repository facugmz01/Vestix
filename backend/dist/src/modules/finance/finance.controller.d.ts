import { AccountsService } from './accounts.service';
export declare class FinanceController {
    private readonly accountsService;
    constructor(accountsService: AccountsService);
    getCurrentAccounts(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
    getAccounts(): Promise<{
        id: string;
        name: string;
        type: string;
        currency: string;
        branchId: string | null;
        balance: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getShifts(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
    getPayments(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
    getInvoices(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
}
