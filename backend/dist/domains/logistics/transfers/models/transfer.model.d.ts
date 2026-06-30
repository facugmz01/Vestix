export declare enum TransferStatus {
    DRAFT = "DRAFT",
    IN_TRANSIT = "IN_TRANSIT",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface TransferLine {
    variantId: string;
    quantity: number;
}
export interface StockTransfer {
    id: string;
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    status: TransferStatus;
    lines: TransferLine[];
    trackingNumber?: string;
    dispatchedAt?: Date;
    receivedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
