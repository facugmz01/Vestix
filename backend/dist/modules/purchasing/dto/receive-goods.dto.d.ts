export declare class ReceiveGoodsLineDto {
    variantId: string;
    receivedQuantity: number;
    batchId?: string;
}
export declare class ReceiveGoodsDto {
    purchaseOrderId: string;
    notes?: string;
    lines: ReceiveGoodsLineDto[];
}
