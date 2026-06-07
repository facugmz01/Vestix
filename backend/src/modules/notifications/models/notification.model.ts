export enum NotificationChannel {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',       // Job is sitting in the in-memory queue
  SENDING = 'SENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',       // Channel error (e.g. SMTP reject, WA 404)
  RETRYING = 'RETRYING',
}

export enum TemplateKey {
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  SHIFT_CLOSING_DISCREPANCY = 'SHIFT_CLOSING_DISCREPANCY',
  WELCOME_CUSTOMER = 'WELCOME_CUSTOMER',
  OTP_CODE = 'OTP_CODE',
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
