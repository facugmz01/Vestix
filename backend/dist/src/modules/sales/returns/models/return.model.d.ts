export declare enum ReturnAction {
    REFUND = "REFUND",
    EXCHANGE = "EXCHANGE",
    STORE_CREDIT = "STORE_CREDIT"
}
export declare enum ReturnCondition {
    SELLABLE = "SELLABLE",
    DAMAGED = "DAMAGED"
}
export interface ReturnLineItem {
    id: string;
    originalOrderLineId: string;
    variantId: string;
    quantity: number;
    condition: ReturnCondition;
    action: ReturnAction;
    refundAmount: number;
    exchangeVariantId?: string;
}
export interface SaleReturn {
    id: string;
    originalOrderId: string;
    branchId: string;
    warehouseId: string;
    customerId?: string;
    lines: ReturnLineItem[];
    totalRefundAmount: number;
    refundAccountId?: string;
    createdAt: Date;
}
