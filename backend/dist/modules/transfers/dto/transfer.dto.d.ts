export declare class TransferLineDto {
    variantId: string;
    quantity: number;
}
export declare class CreateTransferDto {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    notes?: string;
    lines: TransferLineDto[];
}
export declare class ReceiveTransferLineDto {
    variantId: string;
    receivedQuantity: number;
}
export declare class ReceiveTransferDto {
    lines: ReceiveTransferLineDto[];
}
