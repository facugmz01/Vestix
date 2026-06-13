import { AccountsService } from './accounts.service';
import { CashService } from './cash/cash.service';
export declare class FinanceController {
    private readonly accountsService;
    private readonly cashService;
    constructor(accountsService: AccountsService, cashService: CashService);
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
    getActiveShift(req: any): Promise<{
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
    openShift(req: any, body: {
        cashRegisterId: string;
        openingAmount: number;
    }): Promise<{
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
    closeShift(req: any, body: {
        shiftId: string;
        closingAmount: number;
        notes?: string;
    }): Promise<{
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
    getPayments(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
    getInvoices(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
}
