export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  PUSH = 'PUSH',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
  RETRYING = 'RETRYING',
}

/**
 * TemplateKey values must match the NotificationEvent strings used by the frontend
 * and stored verbatim in the NotificationTemplate.event DB column.
 */
export enum TemplateKey {
  // ─── Core sale / order events ──────────────────────────────────────────
  SALE_CONFIRMED                 = 'SALE_CONFIRMED',
  ORDER_SHIPPED                  = 'ORDER_SHIPPED',
  ORDER_DELIVERED                = 'ORDER_DELIVERED',
  DELIVERY_ARRIVED                 = 'DELIVERY_ARRIVED',
  DELIVERY_OTP                     = 'DELIVERY_OTP',
  PAYMENT_RECEIVED               = 'PAYMENT_RECEIVED',

  // ─── Stock & operations ────────────────────────────────────────────────
  LOW_STOCK_ALERT                = 'LOW_STOCK_ALERT',
  SHIFT_CLOSING_DISCREPANCY      = 'SHIFT_CLOSING_DISCREPANCY',

  // ─── Purchasing / supply chain ─────────────────────────────────────────
  PURCHASE_ORDER_ISSUED          = 'PURCHASE_ORDER_ISSUED',
  GOODS_RECEIPT_RECEIVED         = 'GOODS_RECEIPT_RECEIVED',

  // ─── Transfers ─────────────────────────────────────────────────────────
  TRANSFER_DISPATCHED            = 'TRANSFER_DISPATCHED',
  TRANSFER_RECEIVED              = 'TRANSFER_RECEIVED',

  // ─── Finance / invoicing ───────────────────────────────────────────────
  INVOICE_ISSUED                 = 'INVOICE_ISSUED',
  RETURN_APPROVED                = 'RETURN_APPROVED',

  // ─── Current accounts & manual sends ──────────────────────────────────
  OVERDUE_CURRENT_ACCOUNT        = 'OVERDUE_CURRENT_ACCOUNT',
  MANUAL_CURRENT_ACCOUNT_STATEMENT = 'MANUAL_CURRENT_ACCOUNT_STATEMENT',
  MANUAL_SALE_RECEIPT            = 'MANUAL_SALE_RECEIPT',
  MANUAL_QUOTATION_RECEIPT       = 'MANUAL_QUOTATION_RECEIPT',

  // ─── Misc ──────────────────────────────────────────────────────────────
  WELCOME_CUSTOMER               = 'WELCOME_CUSTOMER',
  OTP_CODE                       = 'OTP_CODE',
}

/**
 * A Notification Template is a stored reusable message with
 * Handlebars-style variable interpolation: {{customerName}}, {{orderId}}, etc.
 */
export interface NotificationTemplate {
  key: TemplateKey;
  channel: NotificationChannel;
  subject?: string; // Email only
  body: string;     // Supports {{variable}} placeholders
}

/**
 * A Notification Job is a single dispatch task pushed to the queue.
 */
export interface NotificationJob {
  id: string;
  channel: NotificationChannel;
  templateKey: TemplateKey;
  recipient: string;   // Email address OR phone number (+5491122334455)
  variables: Record<string, string>; // Values to inject into the template
  status: NotificationStatus;
  attempts: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}
