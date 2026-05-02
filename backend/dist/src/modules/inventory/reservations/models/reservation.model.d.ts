export declare enum ReservationStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED"
}
export interface ReservationLine {
    variantId: string;
    quantity: number;
}
export interface StockReservation {
    id: string;
    warehouseId: string;
    branchId: string;
    customerId?: string;
    lines: ReservationLine[];
    status: ReservationStatus;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
