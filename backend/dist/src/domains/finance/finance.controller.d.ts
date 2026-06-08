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
    getPaymentMethods(): Promise<({
        cashRegister: {
            id: string;
            name: string;
            code: string;
            branchId: string;
            status: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        account: {
            id: string;
            name: string;
            type: string;
            currency: string;
            branchId: string | null;
            balance: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        type: string;
        cashRegisterId: string | null;
        accountId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createPaymentMethod(body: any): Promise<{
        id: string;
        name: string;
        type: string;
        cashRegisterId: string | null;
        accountId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePaymentMethod(id: string, body: any): Promise<{
        id: string;
        name: string;
        type: string;
        cashRegisterId: string | null;
        accountId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
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
