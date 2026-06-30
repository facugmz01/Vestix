export declare enum NotificationChannel {
    EMAIL = "EMAIL",
    WHATSAPP = "WHATSAPP",
    SMS = "SMS",
    PUSH = "PUSH"
}
export declare enum NotificationStatus {
    PENDING = "PENDING",
    QUEUED = "QUEUED",
    SENDING = "SENDING",
    SENT = "SENT",
    FAILED = "FAILED",
    BOUNCED = "BOUNCED",
    RETRYING = "RETRYING"
}
export declare enum TemplateKey {
    SALE_CONFIRMED = "SALE_CONFIRMED",
    ORDER_SHIPPED = "ORDER_SHIPPED",
    ORDER_DELIVERED = "ORDER_DELIVERED",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    LOW_STOCK_ALERT = "LOW_STOCK_ALERT",
    SHIFT_CLOSING_DISCREPANCY = "SHIFT_CLOSING_DISCREPANCY",
    PURCHASE_ORDER_ISSUED = "PURCHASE_ORDER_ISSUED",
    GOODS_RECEIPT_RECEIVED = "GOODS_RECEIPT_RECEIVED",
    TRANSFER_DISPATCHED = "TRANSFER_DISPATCHED",
    TRANSFER_RECEIVED = "TRANSFER_RECEIVED",
    INVOICE_ISSUED = "INVOICE_ISSUED",
    RETURN_APPROVED = "RETURN_APPROVED",
    OVERDUE_CURRENT_ACCOUNT = "OVERDUE_CURRENT_ACCOUNT",
    MANUAL_CURRENT_ACCOUNT_STATEMENT = "MANUAL_CURRENT_ACCOUNT_STATEMENT",
    MANUAL_SALE_RECEIPT = "MANUAL_SALE_RECEIPT",
    WELCOME_CUSTOMER = "WELCOME_CUSTOMER",
    OTP_CODE = "OTP_CODE"
}
export interface NotificationTemplate {
    key: TemplateKey;
    channel: NotificationChannel;
    subject?: string;
    body: string;
}
export interface NotificationJob {
    id: string;
    channel: NotificationChannel;
    templateKey: TemplateKey;
    recipient: string;
    variables: Record<string, string>;
    status: NotificationStatus;
    attempts: number;
    lastError?: string;
    createdAt: Date;
    updatedAt: Date;
}
