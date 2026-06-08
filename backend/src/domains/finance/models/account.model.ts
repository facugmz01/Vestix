export enum AccountType {
  CASH = 'CASH',                 // Physical POS Cash Drawers
  BANK = 'BANK',                 // Official bank accounts
  CREDIT_CARD = 'CREDIT_CARD',   // Payment Gateways (e.g., MercadoPago, Stripe clearing)
  EXPENSE = 'EXPENSE',           // Petty cash or operational expenses
  REVENUE = 'REVENUE',           // Abstract holding for income
}

export enum TransactionType {
  DEBIT = 'DEBIT',   // Increases Asset accounts (Money In)
  CREDIT = 'CREDIT', // Decreases Asset accounts (Money Out)
}

/**
 * Represents a Treasury destination (where money physically or virtually sits).
 */
export interface FinancialAccount {
  id: string;
  name: string;      // e.g., "Main Register - Branch 1", "Galicia Bank Core"
  type: AccountType;
  currency: string;
  branchId?: string; // Links a physical Cash Drawer strictly to a branch
  
  // Real-time calculated balance. Strictly mutated via Transactions.
  balance: number;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Immutable Double-Entry Ledger for money (mirrors the Inventory Ledger for stock).
 */
export interface FinancialTransaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;       // Must strictly be a positive number
  referenceId: string;  // e.g., POS Order ID, Supplier Invoice ID
  description: string;
  createdAt: Date;
}

/**
 * A formal, immutable Document generated when money successfully changes hands.
 */
export interface PaymentReceipt {
  id: string;
  accountId: string;     // The Treasury account that received the funds
  amount: number;
  payerName: string;     // E.g., "John Doe" or "Walk-in Customer"
  referenceId: string;   
  issuedAt: Date;
}
