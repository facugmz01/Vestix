export declare class BulkSaleRowDto {
    orderId: string;
    date?: string;
    customerIdentifier?: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    paymentStatus?: string;
}
export declare class BulkImportSalesDto {
    rows: BulkSaleRowDto[];
    updateStock: boolean;
    paymentResolution: 'PAID_CASH' | 'CURRENT_ACCOUNT' | 'FROM_CSV';
    branchId: string;
}
