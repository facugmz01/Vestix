export enum InvoiceType {
  FACTURA_A = 'FACTURA_A', // B2B: Registered Taxpayer (Discriminates VAT)
  FACTURA_B = 'FACTURA_B', // B2C: Final Consumer (VAT included in price)
  FACTURA_C = 'FACTURA_C', // Monotributo
  NOTA_CREDITO_A = 'NOTA_CREDITO_A', // B2B Return/Refund
  NOTA_CREDITO_B = 'NOTA_CREDITO_B'  // B2C Return/Refund
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING_AFIP = 'PENDING_AFIP', // Waiting on government API response
  APPROVED = 'APPROVED',         // Received CAE (Legalized)
  FAILED = 'FAILED',             // AFIP unavailable or not configured
  REJECTED = 'REJECTED',         // AFIP threw an error (e.g., invalid CUIT)
  CANCELLED = 'CANCELLED',
}

/**
 * Represents a legal, government-approved electronic invoice.
 * Completely separate from internal 'SaleOrders' which are just operational tracking.
 */
export interface Invoice {
  id: string;
  orderId: string; // Links back to the internal Sales module
  type: InvoiceType;
  
  // --- AFIP Legal Fields ---
  cae?: string; // Código de Autorización Electrónico (Electronic Authorization Code)
  caeExpiration?: Date;
  receiptNumber?: string; // Formatted Point of Sale + Invoice Number e.g., "0001-00000123"
  
  // --- Customer Tax Info ---
  customerDocumentType: string; // DNI, CUIT
  customerDocumentNumber: string;
  
  // --- Financials ---
  netAmount: number;
  vatAmount: number; // IVA
  totalAmount: number;
  
  status: InvoiceStatus;
  afipErrorMessage?: string; // Critical for troubleshooting why AFIP rejected a batch
  
  createdAt: Date;
  updatedAt: Date;
}
