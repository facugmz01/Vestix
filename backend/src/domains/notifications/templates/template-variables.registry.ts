import { TemplateKey } from '../models/notification.model';

/** Variables documented per template event — used by admin UI and preview. */
export const TEMPLATE_VARIABLES: Record<string, { name: string; description: string }[]> = {
  [TemplateKey.SALE_CONFIRMED]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'orderId', description: 'Número/código del pedido' },
    { name: 'total', description: 'Monto total formateado' },
  ],
  [TemplateKey.ORDER_SHIPPED]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'orderId', description: 'Número del pedido' },
    { name: 'courierName', description: 'Empresa de envío' },
    { name: 'trackingNumber', description: 'Código de seguimiento' },
  ],
  [TemplateKey.PAYMENT_RECEIVED]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'orderId', description: 'Número del pedido' },
    { name: 'amount', description: 'Monto pagado' },
    { name: 'receiptId', description: 'ID del comprobante' },
  ],
  [TemplateKey.LOW_STOCK_ALERT]: [
    { name: 'productName', description: 'Nombre del producto' },
    { name: 'sku', description: 'SKU de la variante' },
    { name: 'quantity', description: 'Stock disponible actual' },
    { name: 'branchName', description: 'Sucursal' },
  ],
  [TemplateKey.SHIFT_CLOSING_DISCREPANCY]: [
    { name: 'branchName', description: 'Sucursal' },
    { name: 'cashierName', description: 'Cajero' },
    { name: 'registerName', description: 'Caja registradora' },
    { name: 'difference', description: 'Diferencia de arqueo' },
    { name: 'expected', description: 'Monto esperado' },
    { name: 'actual', description: 'Monto contado' },
  ],
  [TemplateKey.PURCHASE_ORDER_ISSUED]: [
    { name: 'supplierName', description: 'Proveedor' },
    { name: 'orderId', description: 'Número de OC' },
    { name: 'total', description: 'Monto total' },
    { name: 'companyName', description: 'Nombre de la empresa' },
  ],
  [TemplateKey.GOODS_RECEIPT_RECEIVED]: [
    { name: 'orderId', description: 'Número de OC' },
    { name: 'branchName', description: 'Sucursal destino' },
    { name: 'date', description: 'Fecha de recepción' },
  ],
  [TemplateKey.TRANSFER_DISPATCHED]: [
    { name: 'sourceBranch', description: 'Sucursal origen' },
    { name: 'destinationBranch', description: 'Sucursal destino' },
    { name: 'branchName', description: 'Sucursal referencia' },
    { name: 'date', description: 'Fecha' },
  ],
  [TemplateKey.TRANSFER_RECEIVED]: [
    { name: 'destinationBranch', description: 'Sucursal destino' },
    { name: 'branchName', description: 'Sucursal referencia' },
    { name: 'date', description: 'Fecha' },
  ],
  [TemplateKey.OVERDUE_CURRENT_ACCOUNT]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'balance', description: 'Saldo total' },
    { name: 'overdueAmount', description: 'Monto vencido' },
  ],
  [TemplateKey.MANUAL_CURRENT_ACCOUNT_STATEMENT]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'balance', description: 'Saldo total' },
    { name: 'overdueAmount', description: 'Monto vencido' },
  ],
  [TemplateKey.MANUAL_SALE_RECEIPT]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'saleId', description: 'ID de venta' },
    { name: 'total', description: 'Monto total' },
    { name: 'receiptUrl', description: 'URL del comprobante' },
  ],
  [TemplateKey.WELCOME_CUSTOMER]: [
    { name: 'customerName', description: 'Nombre del cliente' },
    { name: 'storeName', description: 'Nombre de la tienda' },
  ],
  [TemplateKey.OTP_CODE]: [
    { name: 'otpCode', description: 'Código de verificación de 6 dígitos' },
  ],
};

export function interpolateTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}
