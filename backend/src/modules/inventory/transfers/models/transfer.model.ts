export enum TransferStatus {
  DRAFT = 'DRAFT',             // Request created, stock validated but still available in source
  IN_TRANSIT = 'IN_TRANSIT',   // Stock has left the source building, not yet arrived at destination
  COMPLETED = 'COMPLETED',     // Destination warehouse has successfully received and scanned the goods
  CANCELLED = 'CANCELLED',     // Request aborted
}

export interface TransferLine {
  variantId: string;
  quantity: number;
}

/**
 * Orchestrates the physical movement of inventory across the state machine.
 */
export interface StockTransfer {
  id: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: TransferStatus;
  lines: TransferLine[];
  
  // Logistics tracking
  trackingNumber?: string;
  dispatchedAt?: Date;
  receivedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}
