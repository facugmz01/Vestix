export enum ReservationStatus {
  ACTIVE = 'ACTIVE',       // Stock is physically locked and removed from available pool
  COMPLETED = 'COMPLETED', // Payment cleared, stock officially left the building
  EXPIRED = 'EXPIRED',     // Time to checkout ran out, stock returned to available pool automatically
  CANCELLED = 'CANCELLED'  // Customer explicitly emptied their cart or payment failed
}

export interface ReservationLine {
  variantId: string;
  quantity: number;
}

/**
 * Manages temporary holds on inventory.
 * Highly critical for omni-channel setups to prevent "Phantom Stock" overselling
 * when an online customer is entering their credit card while a POS cashier scans the same item.
 */
export interface StockReservation {
  id: string; // Typically maps identically to the E-commerce Cart ID
  warehouseId: string;
  branchId: string;
  customerId?: string;
  
  lines: ReservationLine[];
  status: ReservationStatus;
  
  // Time-To-Live constraint
  expiresAt: Date; 
  createdAt: Date;
  updatedAt: Date;
}
