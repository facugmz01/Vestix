export declare enum POStatus {
    DRAFT = "DRAFT",
    ISSUED = "ISSUED",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface POLineItem {
    id: string;
    variantId: string;
    orderedQuantity: number;
    receivedQuantity: number;
    unitCost: number;
}
export interface PurchaseOrder {
    id: string;
    supplierId: string;
    destinationWarehouseId: string;
    status: POStatus;
    lines: POLineItem[];
    totalCost: number;
    issuedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
