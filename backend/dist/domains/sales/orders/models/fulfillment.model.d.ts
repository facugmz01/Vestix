export declare enum OrderStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID",
    PICKING = "PICKING",
    PACKED = "PACKED",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED"
}
export interface OrderFulfillment {
    id: string;
    saleOrderId: string;
    status: OrderStatus;
    trackingNumber?: string;
    courierName?: string;
    paidAt?: Date;
    pickedAt?: Date;
    packedAt?: Date;
    shippedAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
