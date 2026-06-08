export declare enum CustomerType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS"
}
export interface CustomerCredit {
    limit: number;
    used: number;
    available: number;
    onHold: boolean;
}
export interface Customer {
    id: string;
    type: CustomerType;
    fullName: string;
    taxId?: string;
    email?: string;
    phone?: string;
    priceListId?: string;
    credit: CustomerCredit;
    createdAt: Date;
    updatedAt: Date;
}
export interface CustomerHistoryRecord {
    id: string;
    customerId: string;
    actionType: string;
    referenceId: string;
    description: string;
    createdAt: Date;
}
