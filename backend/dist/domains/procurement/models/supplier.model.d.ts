export interface SupplierAccount {
    balance: number;
    currency: string;
}
export interface Supplier {
    id: string;
    companyName: string;
    contactName?: string;
    taxId?: string;
    email?: string;
    phone?: string;
    account: SupplierAccount;
    createdAt: Date;
    updatedAt: Date;
}
export interface SupplierLedgerRecord {
    id: string;
    supplierId: string;
    actionType: string;
    amount: number;
    referenceId: string;
    description: string;
    createdAt: Date;
}
