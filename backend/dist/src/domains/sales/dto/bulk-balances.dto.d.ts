export declare class BulkBalanceRowDto {
    identifier: string;
    balance: number;
}
export declare class BulkImportBalancesDto {
    rows: BulkBalanceRowDto[];
    resolution: 'overwrite' | 'add';
}
