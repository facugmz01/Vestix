export enum MovementType {
  GOODS_RECEIPT = 'GOODS_RECEIPT',             // Supplier -> Warehouse
  SALE = 'SALE',                               // Warehouse -> Customer
  RETURN = 'RETURN',                           // Customer -> Warehouse
  TRANSFER_OUT = 'TRANSFER_OUT',               // Warehouse A -> Transit
  TRANSFER_IN = 'TRANSFER_IN',                 // Transit -> Warehouse B
  SHRINKAGE = 'SHRINKAGE',                     // Warehouse -> Loss (Theft, Damage)
  POS_CORRECTION = 'POS_CORRECTION',           // Auto-generated offline negative stock fix
  RESERVATION = 'RESERVATION',                 // Available -> Reserved (E-commerce order placed)
  RESERVATION_RELEASE = 'RESERVATION_RELEASE', // Reserved -> Available (E-commerce order cancelled)
}

/**
 * DOUBLE-ENTRY SOURCE OF TRUTH
 * Stock levels are never arbitrarily updated. They are calculated by summing these immutable records.
 */
export interface InventoryMovement {
  id: string;
  variantId: string;
  
  // Double-entry accounting principles: Every movement has a source and destination
  sourceWarehouseId: string | null;      // Null if goods are originating from external Supplier
  destinationWarehouseId: string | null; // Null if goods are leaving to Customer/Shrinkage
  
  type: MovementType;
  quantity: number;                      // Must strictly be a positive integer
  
  // The calculated Weighted Average Cost of the item *at the exact time* of movement
  // Critical for generating accurate COGS (Cost of Goods Sold) financial reports.
  unitCost: number;                      
  
  referenceId: string | null;            // Maps to Order ID, Purchase Order ID, or Transfer ID
  createdAt: Date;
}
