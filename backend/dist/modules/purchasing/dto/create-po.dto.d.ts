export declare class PurchaseOrderLineDto {
    variantId: string;
    orderedQuantity: number;
    unitCost: number;
}
export declare class CreatePurchaseOrderDto {
    supplierId: string;
    destinationWarehouseId: string;
    notes?: string;
    lines: PurchaseOrderLineDto[];
}
