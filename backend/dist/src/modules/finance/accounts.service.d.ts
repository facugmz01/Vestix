import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
export declare class AccountsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAccount(dto: CreateAccountDto): Promise<{
        id: string;
        name: string;
        type: string;
        currency: string;
        branchId: string | null;
        balance: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getAccount(id: string): Promise<{
        transactions: {
            id: string;
            accountId: string;
            type: string;
            amount: number;
            referenceId: string;
            description: string;
            createdAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        type: string;
        currency: string;
        branchId: string | null;
        balance: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
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
    createPaymentMethod(data: {
        name: string;
        type: string;
        accountId?: string;
        cashRegisterId?: string;
    }): Promise<{
        id: string;
        name: string;
        type: string;
        cashRegisterId: string | null;
        accountId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePaymentMethod(id: string, data: any): Promise<{
        id: string;
        name: string;
        type: string;
        cashRegisterId: string | null;
        accountId: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    postTransaction(accountId: string, type: 'DEBIT' | 'CREDIT', amount: number, referenceId: string, description: string): Promise<{
        id: string;
        accountId: string;
        type: string;
        amount: number;
        referenceId: string;
        description: string;
        createdAt: Date;
    }>;
    generateIncomingReceipt(payload: {
        accountId: string;
        amount: number;
        payerName: string;
        referenceId: string;
        description: string;
    }): Promise<{
        id: string;
        accountId: string;
        amount: number;
        payerName: string;
        referenceId: string;
        issuedAt: Date;
    }>;
    processOutgoingPayment(payload: {
        accountId: string;
        amount: number;
        payeeName: string;
        referenceId: string;
        description: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
