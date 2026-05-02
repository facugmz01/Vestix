export interface StockLevel {
    variantId: string;
    warehouseId: string;
    branchId: string | null;
    physicalQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    updatedAt: Date;
}
