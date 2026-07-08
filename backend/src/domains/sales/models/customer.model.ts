export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL', // Standard retail customer
  BUSINESS = 'BUSINESS',     // B2B wholesale client
}

export enum CustomerSource {
  ADMIN = 'ADMIN',
  STOREFRONT = 'STOREFRONT',
  POS = 'POS',
  IMPORT = 'IMPORT',
}

export interface CustomerCredit {
  limit: number;     // Maximum allowed debt
  used: number;      // Current outstanding debt
  available: number; // Calculated: limit - used
  onHold: boolean;   // True if payments are severely delayed or manually flagged
}

export interface Customer {
  id: string;
  type: CustomerType;
  source: CustomerSource;
  fullName: string;
  taxId?: string; // DNI, CUIT, or SSN for official electronic invoices
  email?: string;
  phone?: string;
  
  // CRM & Pricing Integration
  priceListId?: string; // Maps to the Pricing module (e.g., "Wholesale List")
  
  // Financial
  credit: CustomerCredit;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Immutable log of everything related to a customer.
 * Essential for auditing credit decisions and resolving disputes.
 */
export interface CustomerHistoryRecord {
  id: string;
  customerId: string;
  actionType: string; // e.g., 'PURCHASE', 'CREDIT_LIMIT_INCREASE', 'REPAYMENT'
  referenceId: string; // e.g., Order ID or Payment ID
  description: string;
  createdAt: Date;
}
