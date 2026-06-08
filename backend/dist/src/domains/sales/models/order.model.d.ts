export declare enum OrderSource {
    POS = "POS",
    ECOMMERCE = "ECOMMERCE",
    BACKOFFICE = "BACKOFFICE"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    CREDIT_CARD = "CREDIT_CARD",
    BANK_TRANSFER = "BANK_TRANSFER",
    CUSTOMER_CREDIT = "CUSTOMER_CREDIT"
}
export interface OrderLineItem {
    id: string;
    variantId: string;
    categoryId: string;
    quantity: number;
    basePrice: number;
    discountAmount: number;
    finalPrice: number;
}
export interface SaleOrder {
    id: string;
    branchId: string;
    source: OrderSource;
    customerId?: string;
    lines: OrderLineItem[];
    subtotal: number;
    cartDiscountTotal: number;
    grandTotal: number;
    appliedPromotions: string[];
    paymentMethod: PaymentMethod;
    paymentAccountId?: string;
    createdAt: Date;
    syncedAt: Date;
}
