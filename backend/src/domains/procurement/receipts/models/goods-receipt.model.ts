export enum ReceiptStatus {
  DRAFT = 'DRAFT',         // Scanned off the truck, pending review
  VALIDATED = 'VALIDATED', // Approved, stock officially entered into the double-entry ledger
  DISPUTED = 'DISPUTED',   // Physical quantities did not match the PO, pending manager approval
}

export interface GoodsReceiptLine {
  id: string;
  poLineItemId: string;
  variantId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  
  // The critical metric: (received - expected). Negative means short-shipped, positive means over-shipped.
  difference: number; 
  notes?: string;
}

/**
 * The physical document representing a truck unloading.
 * A single Purchase Order might have multiple Goods Receipts over time.
 */
export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  destinationWarehouseId: string;
  receivedByUserId: string; // The specific warehouse worker who scanned the boxes
  status: ReceiptStatus;
  lines: GoodsReceiptLine[];
  createdAt: Date;
  updatedAt: Date;
}
