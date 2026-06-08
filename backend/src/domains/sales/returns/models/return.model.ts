export enum ReturnAction {
  REFUND = 'REFUND',             // Returning money directly to the customer (Cash/Card)
  EXCHANGE = 'EXCHANGE',         // Swapping the item for a different Variant (e.g., wrong size)
  STORE_CREDIT = 'STORE_CREDIT'  // Refunding the value to the B2B customer's internal CRM balance
}

export enum ReturnCondition {
  SELLABLE = 'SELLABLE', // The item is in perfect condition and goes back onto the physical shelf
  DAMAGED = 'DAMAGED'    // The item is stained/torn. We accept it, but it must be written off as shrinkage.
}

export interface ReturnLineItem {
  id: string;
  originalOrderLineId: string; // Links exactly to what they bought
  variantId: string;
  quantity: number;
  condition: ReturnCondition;
  action: ReturnAction;
  
  refundAmount: number; // Supports partial refunds (e.g., 50% refund for a slight defect)
  
  exchangeVariantId?: string; // MANDATORY if Action is EXCHANGE. What item are they taking instead?
}

/**
 * Immutable document representing a complex return operation.
 */
export interface SaleReturn {
  id: string;
  originalOrderId: string;
  branchId: string;
  warehouseId: string; // Where the physical goods are being returned to
  customerId?: string;
  
  lines: ReturnLineItem[];
  
  totalRefundAmount: number;
  refundAccountId?: string; // The physical treasury account (e.g., Cash Drawer) losing the money
  
  createdAt: Date;
}
