export declare class BulkProductRowDto {
    name: string;
    sku?: string;
    barcode?: string;
    category?: string;
    brand?: string;
    costPrice?: number;
    basePrice?: number;
    initialStock?: number;
    resolution?: 'overwrite' | 'skip';
}
export declare class BulkValidateDto {
    rows: BulkProductRowDto[];
}
export declare class BulkImportDto {
    rows: BulkProductRowDto[];
}
