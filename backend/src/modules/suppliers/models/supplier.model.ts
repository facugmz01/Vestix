export interface SupplierAccount {
  // Accounts Payable: How much we owe the supplier. 
  // Positive means we are in debt to them. Negative means we overpaid or they owe us a refund.
  balance: number; 
  currency: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactName?: string;
  taxId?: string; // CUIT/Tax ID for billing and electronic invoices
  email?: string;
  phone?: string;
  
  // Financial (Accounts Payable)
  account: SupplierAccount;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Immutable financial ledger tracking every invoice and payment.
 * Essential for reconciling bank statements with the supplier's statements.
 */
export interface SupplierLedgerRecord {
  id: string;
  supplierId: string;
  actionType: string;  // e.g., 'INVOICE_RECEIVED', 'PAYMENT_SENT', 'CREDIT_NOTE'
  amount: number;      // Financial impact (+ increases our debt, - decreases our debt)
  referenceId: string; // e.g., Invoice Number, Bank Transfer ID
  description: string;
  createdAt: Date;
}
