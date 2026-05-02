export declare enum SyncDirection {
    INBOUND = "INBOUND",
    OUTBOUND = "OUTBOUND"
}
export declare enum SyncJobStatus {
    QUEUED = "QUEUED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    RETRYING = "RETRYING"
}
export declare enum WooCommerceEvent {
    ORDER_CREATED = "woocommerce_new_order",
    ORDER_STATUS_UPDATED = "woocommerce_order_status_changed",
    PRODUCT_UPDATED = "woocommerce_product_updated"
}
export interface SyncJob {
    id: string;
    direction: SyncDirection;
    event: string;
    payload: Record<string, any>;
    status: SyncJobStatus;
    attempts: number;
    lastError?: string;
    externalId?: string;
    createdAt: Date;
    updatedAt: Date;
}
