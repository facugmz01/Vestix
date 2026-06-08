export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/**
 * Tracks the daily lifecycle of a physical cash register.
 * Essential for detecting retail theft and cashier errors.
 */
export interface CashShift {
  id: string;
  accountId: string; // The physical CASH account (Treasury ledger)
  openedByUserId: string;
  closedByUserId?: string;
  
  status: ShiftStatus;
  
  // Auditing Metrics
  openingBalance: number;          // What the cashier reported was in the drawer at 9:00 AM
  expectedClosingBalance?: number; // Calculated by the system (Opening + Sales - Expenses)
  actualClosingBalance?: number;   // The "Blind Count" the cashier typed in at 6:00 PM
  
  // Critical Security Metric: (Actual - Expected). 
  // Negative means cash is missing. Positive means they shortchanged a customer.
  difference?: number;             
  
  openedAt: Date;
  closedAt?: Date;
}
