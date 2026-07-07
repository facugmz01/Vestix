import type { NotificationChannel } from '@/types';

export const NOTIFICATION_EVENT_LABELS: Record<string, string> = {
  SALE_CONFIRMED:                  'Venta Confirmada',
  ORDER_SHIPPED:                   'Pedido Enviado',
  ORDER_DELIVERED:                 'Pedido Entregado',
  PAYMENT_RECEIVED:                'Pago Recibido',
  PURCHASE_ORDER_ISSUED:           'OC Emitida',
  GOODS_RECEIPT_RECEIVED:          'Recepción Mercadería',
  LOW_STOCK_ALERT:                 'Alerta Stock Bajo',
  SHIFT_CLOSING_DISCREPANCY:       'Diferencia de Caja',
  TRANSFER_DISPATCHED:             'Transfer. Despachada',
  TRANSFER_RECEIVED:               'Transfer. Recibida',
  INVOICE_ISSUED:                  'Factura Emitida',
  RETURN_APPROVED:                 'Dev. Aprobada',
  OVERDUE_CURRENT_ACCOUNT:         'Cuenta Corriente Vencida',
  MANUAL_CURRENT_ACCOUNT_STATEMENT:'Envío Manual: Cta. Cte.',
  MANUAL_SALE_RECEIPT:             'Envío Manual: Venta',
  WELCOME_CUSTOMER:                'Bienvenida Cliente',
  OTP_CODE:                        'Código OTP',
};

export const NOTIFICATION_CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PUSH', label: 'Push (App Móvil)' },
];

/** Variables alineadas con el registry del backend */
export const TEMPLATE_VARIABLES_BY_EVENT: Record<string, string[]> = {
  SALE_CONFIRMED: ['{{customerName}}', '{{orderId}}', '{{total}}'],
  ORDER_SHIPPED: ['{{customerName}}', '{{orderId}}', '{{courierName}}', '{{trackingNumber}}'],
  PAYMENT_RECEIVED: ['{{customerName}}', '{{orderId}}', '{{amount}}', '{{receiptId}}'],
  LOW_STOCK_ALERT: ['{{productName}}', '{{sku}}', '{{quantity}}', '{{branchName}}'],
  SHIFT_CLOSING_DISCREPANCY: ['{{branchName}}', '{{cashierName}}', '{{registerName}}', '{{difference}}', '{{expected}}', '{{actual}}'],
  PURCHASE_ORDER_ISSUED: ['{{supplierName}}', '{{orderId}}', '{{total}}', '{{companyName}}'],
  GOODS_RECEIPT_RECEIVED: ['{{orderId}}', '{{branchName}}', '{{date}}'],
  TRANSFER_DISPATCHED: ['{{sourceBranch}}', '{{destinationBranch}}', '{{branchName}}', '{{date}}'],
  TRANSFER_RECEIVED: ['{{destinationBranch}}', '{{branchName}}', '{{date}}'],
  OVERDUE_CURRENT_ACCOUNT: ['{{customerName}}', '{{balance}}', '{{overdueAmount}}'],
  MANUAL_CURRENT_ACCOUNT_STATEMENT: ['{{customerName}}', '{{balance}}', '{{overdueAmount}}'],
  MANUAL_SALE_RECEIPT: ['{{customerName}}', '{{saleId}}', '{{total}}', '{{receiptUrl}}'],
  WELCOME_CUSTOMER: ['{{customerName}}', '{{storeName}}'],
  OTP_CODE: ['{{otpCode}}'],
};

export const DEFAULT_PREVIEW_VARIABLES: Record<string, string> = {
  customerName: 'María García',
  orderId: 'V-1024',
  saleId: 'V-1024',
  total: '15.000,00',
  amount: '15.000,00',
  otpCode: '482910',
  productName: 'Remera Básica',
  sku: 'REM-BLK-M',
  quantity: '3',
  branchName: 'Sucursal Centro',
  courierName: 'Andreani',
  trackingNumber: 'AR123456789',
  balance: '8.500,00',
  overdueAmount: '2.000,00',
  supplierName: 'Proveedor SA',
  companyName: 'Vestix',
  storeName: 'Vestix',
  receiptUrl: 'https://tienda.ejemplo.com/comprobante',
  date: new Date().toLocaleDateString('es-AR'),
};
