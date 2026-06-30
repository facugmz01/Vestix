export declare enum MovementType {
    GOODS_RECEIPT = "GOODS_RECEIPT",
    SALE = "SALE",
    RETURN = "RETURN",
    TRANSFER_OUT = "TRANSFER_OUT",
    TRANSFER_IN = "TRANSFER_IN",
    SHRINKAGE = "SHRINKAGE",
    POS_CORRECTION = "POS_CORRECTION",
    RESERVATION = "RESERVATION",
    RESERVATION_RELEASE = "RESERVATION_RELEASE"
}
export interface InventoryMovement {
    id: string;
    variantId: string;
    sourceWarehouseId: string | null;
    destinationWarehouseId: string | null;
    type: MovementType;
    quantity: number;
    unitCost: number;
    referenceId: string | null;
    createdAt: Date;
}
