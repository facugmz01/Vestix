export declare enum ReturnAction {
    REFUND = "REFUND",
    EXCHANGE = "EXCHANGE",
    STORE_CREDIT = "STORE_CREDIT"
}
export declare enum ReturnCondition {
    SELLABLE = "SELLABLE",
    DAMAGED = "DAMAGED",
    DEFECTIVE = "DEFECTIVE"
}
declare class CreateReturnItemDto {
    orderLineId: string;
    variantId: string;
    quantity: number;
    condition: ReturnCondition;
    reason?: string;
}
export declare class CreateReturnDto {
    saleOrderId: string;
    branchId: string;
    action: ReturnAction;
    items: CreateReturnItemDto[];
}
export {};
