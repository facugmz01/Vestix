export enum PaymentProvider {
  MERCADO_PAGO = 'MERCADO_PAGO',
  STRIPE = 'STRIPE',
  CASH = 'CASH',                  // Internal POS usage
  BANK_TRANSFER = 'BANK_TRANSFER' // B2B direct transfers
}

export enum PaymentIntentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',    // User opened the MP checkout but hasn't paid
  APPROVED = 'APPROVED',  // Webhook confirmed funds secured
  REJECTED = 'REJECTED',  // Insufficient funds / fraudulent
  REFUNDED = 'REFUNDED'
}

/**
 * Tracks the lifecycle of a payment attempt through a 3rd party gateway.
 * Bridges the gap between our internal `SaleOrder` and MercadoPago's `Preference ID`.
 */
export interface PaymentIntent {
  id: string; // Internal UUID
  provider: PaymentProvider;
  externalReferenceId: string; // The ID returned by MercadoPago/Stripe
  
  orderId: string; // The internal E-commerce or POS Order this pays for
  amount: number;
  currency: string;
  
  status: PaymentIntentStatus;
  
  createdAt: Date;
  updatedAt: Date;
}
