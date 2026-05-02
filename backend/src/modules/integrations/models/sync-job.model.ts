export enum SyncDirection {
  INBOUND = 'INBOUND',   // WooCommerce → ERP (e.g., new online order arrives)
  OUTBOUND = 'OUTBOUND', // ERP → WooCommerce (e.g., stock level update)
}

export enum SyncJobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

export enum WooCommerceEvent {
  ORDER_CREATED = 'woocommerce_new_order',
  ORDER_STATUS_UPDATED = 'woocommerce_order_status_changed',
  PRODUCT_UPDATED = 'woocommerce_product_updated',
}

/**
 * Represents a single synchronization task, either triggered by an inbound
 * WooCommerce webhook or an outbound ERP event (e.g., stock change).
 */
export interface SyncJob {
  id: string;
  direction: SyncDirection;
  event: string;
  payload: Record<string, any>;
  status: SyncJobStatus;
  attempts: number;
  lastError?: string;
  externalId?: string; // WooCommerce Order/Product ID for traceability
  createdAt: Date;
  updatedAt: Date;
}
