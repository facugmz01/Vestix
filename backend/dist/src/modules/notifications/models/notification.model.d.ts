export declare enum NotificationChannel {
    EMAIL = "EMAIL",
    WHATSAPP = "WHATSAPP"
}
export declare enum NotificationStatus {
    QUEUED = "QUEUED",
    SENDING = "SENDING",
    SENT = "SENT",
    FAILED = "FAILED",
    RETRYING = "RETRYING"
}
export declare enum TemplateKey {
    ORDER_CONFIRMED = "ORDER_CONFIRMED",
    ORDER_SHIPPED = "ORDER_SHIPPED",
    ORDER_DELIVERED = "ORDER_DELIVERED",
    PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
    LOW_STOCK_ALERT = "LOW_STOCK_ALERT",
    SHIFT_CLOSING_DISCREPANCY = "SHIFT_CLOSING_DISCREPANCY",
    WELCOME_CUSTOMER = "WELCOME_CUSTOMER"
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
