export declare class BulkPurchaseRowDto {
    orderId: string;
    date?: string;
    supplierIdentifier?: string;
    sku: string;
    quantity: number;
    unitCost: number;
    paymentStatus?: string;
}
export declare class BulkImportPurchasesDto {
    rows: BulkPurchaseRowDto[];
    updateStock: boolean;
    paymentResolution: 'PAID_CASH' | 'CURRENT_ACCOUNT' | 'FROM_CSV';
    warehouseId: string;
}
