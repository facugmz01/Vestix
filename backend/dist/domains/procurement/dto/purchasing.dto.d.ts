declare class POLineItemDto {
    variantId: string;
    orderedQuantity: number;
    unitCost: number;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    destinationWarehouseId: string;
    lines: POLineItemDto[];
}
declare class POReceiptLineDto {
    lineItemId: string;
    receivedQuantity: number;
}
export declare class ReceivePurchaseOrderDto {
    receipts: POReceiptLineDto[];
}
export {};
