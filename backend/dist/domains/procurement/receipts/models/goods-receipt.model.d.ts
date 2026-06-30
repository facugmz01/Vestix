export declare enum ReceiptStatus {
    DRAFT = "DRAFT",
    VALIDATED = "VALIDATED",
    DISPUTED = "DISPUTED"
}
export interface GoodsReceiptLine {
    id: string;
    poLineItemId: string;
    variantId: string;
    expectedQuantity: number;
    receivedQuantity: number;
    difference: number;
    notes?: string;
}
export interface GoodsReceipt {
    id: string;
    purchaseOrderId: string;
    destinationWarehouseId: string;
    receivedByUserId: string;
    status: ReceiptStatus;
    lines: GoodsReceiptLine[];
    createdAt: Date;
    updatedAt: Date;
}
