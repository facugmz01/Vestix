export declare enum AccountType {
    CASH = "CASH",
    BANK = "BANK",
    CREDIT_CARD = "CREDIT_CARD",
    EXPENSE = "EXPENSE",
    REVENUE = "REVENUE"
}
export declare enum TransactionType {
    DEBIT = "DEBIT",
    CREDIT = "CREDIT"
}
export interface FinancialAccount {
    id: string;
    name: string;
    type: AccountType;
    currency: string;
    branchId?: string;
    balance: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface FinancialTransaction {
    id: string;
    accountId: string;
    type: TransactionType;
    amount: number;
    referenceId: string;
    description: string;
    createdAt: Date;
}
export interface PaymentReceipt {
    id: string;
    accountId: string;
    amount: number;
    payerName: string;
    referenceId: string;
    issuedAt: Date;
}
