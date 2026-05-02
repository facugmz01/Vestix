export declare enum PaymentProvider {
    MERCADO_PAGO = "MERCADO_PAGO",
    STRIPE = "STRIPE",
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER"
}
export declare enum PaymentIntentStatus {
    CREATED = "CREATED",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    REFUNDED = "REFUNDED"
}
export interface PaymentIntent {
    id: string;
    provider: PaymentProvider;
    externalReferenceId: string;
    orderId: string;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    createdAt: Date;
    updatedAt: Date;
}
