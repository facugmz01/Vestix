import { FinancialAccount, TransactionType, FinancialTransaction, PaymentReceipt } from './models/account.model';
import { CreateAccountDto } from './dto/create-account.dto';
export declare class AccountsService {
    private accounts;
    private transactions;
    private receipts;
    createAccount(dto: CreateAccountDto): Promise<FinancialAccount>;
    getAccount(id: string): Promise<FinancialAccount>;
    postTransaction(accountId: string, type: TransactionType, amount: number, referenceId: string, description: string): Promise<FinancialTransaction>;
    generateIncomingReceipt(payload: {
        accountId: string;
        amount: number;
        payerName: string;
        referenceId: string;
        description: string;
    }): Promise<PaymentReceipt>;
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
