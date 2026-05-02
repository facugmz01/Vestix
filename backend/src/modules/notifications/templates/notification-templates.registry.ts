import { NotificationTemplate, NotificationChannel, TemplateKey } from '../models/notification.model';

/**
 * Static registry of all templates.
 * In production, these can be migrated to a DB table for no-code editing by the store manager.
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    key: TemplateKey.ORDER_CONFIRMED,
    channel: NotificationChannel.EMAIL,
    subject: 'Tu pedido #{{orderId}} fue confirmado ✅',
    body: `Hola {{customerName}},\n\nRecibimos tu pedido #{{orderId}} por $ {{total}}.\nEstaremos preparándolo pronto.\n\nGracias por tu compra.`,
  },
  {
    key: TemplateKey.ORDER_CONFIRMED,
    channel: NotificationChannel.WHATSAPP,
    body: `✅ *Pedido confirmado*\nHola {{customerName}}! Recibimos tu pedido *#{{orderId}}* por *$ {{total}}*. Te avisaremos cuando esté en camino. 🛍️`,
  },
  {
    key: TemplateKey.ORDER_SHIPPED,
    channel: NotificationChannel.WHATSAPP,
    body: `🚚 *¡Tu pedido está en camino!*\nHola {{customerName}}, tu pedido *#{{orderId}}* fue despachado con *{{courierName}}*.\nTracking: {{trackingNumber}}`,
  },
  {
    key: TemplateKey.ORDER_SHIPPED,
    channel: NotificationChannel.EMAIL,
    subject: 'Tu pedido #{{orderId}} fue enviado 🚚',
    body: `Hola {{customerName}},\n\nTu pedido viaja con {{courierName}}.\nNúmero de seguimiento: {{trackingNumber}}\n\n¡Que lo disfrutes!`,
  },
  {
    key: TemplateKey.PAYMENT_RECEIVED,
    channel: NotificationChannel.EMAIL,
    subject: 'Pago recibido por $ {{amount}} 💳',
    body: `Hola {{customerName}},\n\nAcreditamos tu pago de $ {{amount}} para la orden #{{orderId}}.\nComprobante: {{receiptId}}`,
  },
  {
    key: TemplateKey.LOW_STOCK_ALERT,
    channel: NotificationChannel.EMAIL,
    subject: '⚠️ Stock bajo: {{productName}}',
    body: `ALERTA INTERNA:\n\nEl producto *{{productName}}* (SKU: {{sku}}) tiene solo {{quantity}} unidades disponibles en la sucursal {{branchName}}.\n\nAcción requerida: Generar orden de compra.`,
  },
  {
    key: TemplateKey.SHIFT_CLOSING_DISCREPANCY,
    channel: NotificationChannel.EMAIL,
    subject: '🔴 Diferencia de caja detectada — {{branchName}}',
    body: `ALERTA DE GERENCIA:\n\nEl cajero {{cashierName}} cerró turno con una diferencia de $ {{difference}} en la caja {{registerName}}.\n\nEsperado: $ {{expected}}\nContado: $ {{actual}}\n\nRevise el turno en el sistema.`,
  },
  {
    key: TemplateKey.WELCOME_CUSTOMER,
    channel: NotificationChannel.WHATSAPP,
    body: `👋 ¡Hola {{customerName}}! Bienvenido/a a nuestra tienda. Somos *{{storeName}}*. ¿En qué podemos ayudarte hoy?`,
  },
];
