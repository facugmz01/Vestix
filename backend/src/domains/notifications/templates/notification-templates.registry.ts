import { NotificationTemplate, NotificationChannel, TemplateKey } from '../models/notification.model';

/**
 * Static registry of default templates seeded on first boot.
 * All keys must match TemplateKey enum values, which in turn match
 * the NotificationEvent strings used by the frontend.
 */
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // ─── SALE CONFIRMED ────────────────────────────────────────────────────────
  {
    key: TemplateKey.SALE_CONFIRMED,
    channel: NotificationChannel.EMAIL,
    subject: 'Tu pedido #{{orderId}} fue confirmado ✅',
    body: `Hola {{customerName}},\n\nRecibimos tu pedido #{{orderId}} por $ {{total}}.\nEstaremos preparándolo pronto.\n\nGracias por tu compra.`,
  },
  {
    key: TemplateKey.SALE_CONFIRMED,
    channel: NotificationChannel.WHATSAPP,
    body: `✅ *Pedido confirmado*\nHola {{customerName}}! Recibimos tu pedido *#{{orderId}}* por *$ {{total}}*. Te avisaremos cuando esté en camino. 🛍️`,
  },
  {
    key: TemplateKey.SALE_CONFIRMED,
    channel: NotificationChannel.SMS,
    body: `Pedido #{{orderId}} confirmado por $ {{total}}. Gracias {{customerName}}.`,
  },

  // ─── ORDER SHIPPED ─────────────────────────────────────────────────────────
  {
    key: TemplateKey.ORDER_SHIPPED,
    channel: NotificationChannel.WHATSAPP,
    body: `🚚 *¡Tu pedido está en camino!*\nHola {{customerName}}, tu pedido *#{{orderId}}* fue despachado con *{{courierName}}*.\n\n📍 Seguilo en vivo: {{trackingUrl}}\nTracking: {{trackingNumber}}`,
  },
  {
    key: TemplateKey.ORDER_SHIPPED,
    channel: NotificationChannel.EMAIL,
    subject: 'Tu pedido #{{orderId}} fue enviado 🚚',
    body: `Hola {{customerName}},\n\nTu pedido viaja con {{courierName}}.\nSeguimiento en vivo: {{trackingUrl}}\nNúmero de tracking: {{trackingNumber}}\n\n¡Que lo disfrutes!`,
  },
  {
    key: TemplateKey.ORDER_SHIPPED,
    channel: NotificationChannel.SMS,
    body: `Pedido #{{orderId}} enviado con {{courierName}}. Seguimiento: {{trackingUrl}}`,
  },

  // ─── ORDER DELIVERED ───────────────────────────────────────────────────────
  {
    key: TemplateKey.ORDER_DELIVERED,
    channel: NotificationChannel.WHATSAPP,
    body: `✅ *¡Pedido entregado!*\nHola {{customerName}}, confirmamos la entrega de tu pedido *#{{orderId}}*.\n¡Gracias por tu compra! 🛍️`,
  },
  {
    key: TemplateKey.ORDER_DELIVERED,
    channel: NotificationChannel.EMAIL,
    subject: 'Tu pedido #{{orderId}} fue entregado ✅',
    body: `Hola {{customerName}},\n\nTu pedido #{{orderId}} fue entregado exitosamente.\n\nGracias por confiar en nosotros.`,
  },
  {
    key: TemplateKey.ORDER_DELIVERED,
    channel: NotificationChannel.SMS,
    body: `Pedido #{{orderId}} entregado. Gracias {{customerName}}.`,
  },

  // ─── DELIVERY ARRIVED ──────────────────────────────────────────────────────
  {
    key: TemplateKey.DELIVERY_ARRIVED,
    channel: NotificationChannel.WHATSAPP,
    body: `📍 *El repartidor está cerca*\nHola {{customerName}}, el repartidor de tu pedido *#{{orderId}}* llegó a tu zona.\nTené a mano el código de entrega.`,
  },
  {
    key: TemplateKey.DELIVERY_ARRIVED,
    channel: NotificationChannel.SMS,
    body: `El repartidor de tu pedido #{{orderId}} está cerca. Tené a mano el código de entrega.`,
  },

  // ─── DELIVERY OTP ──────────────────────────────────────────────────────────
  {
    key: TemplateKey.DELIVERY_OTP,
    channel: NotificationChannel.WHATSAPP,
    body: `🔐 *Código de entrega — Pedido #{{orderId}}*\n\n*{{otpCode}}*\n\nEntregá este código al repartidor al recibir tu pedido. Válido por 30 minutos.`,
  },
  {
    key: TemplateKey.DELIVERY_OTP,
    channel: NotificationChannel.SMS,
    body: `Código de entrega pedido #{{orderId}}: {{otpCode}}. Válido 30 min.`,
  },

  // ─── PAYMENT RECEIVED ──────────────────────────────────────────────────────
  {
    key: TemplateKey.PAYMENT_RECEIVED,
    channel: NotificationChannel.EMAIL,
    subject: 'Pago recibido por $ {{amount}} 💳',
    body: `Hola {{customerName}},\n\nAcreditamos tu pago de $ {{amount}} para la orden #{{orderId}}.\nComprobante: {{receiptId}}`,
  },

  // ─── LOW STOCK ALERT ───────────────────────────────────────────────────────
  {
    key: TemplateKey.LOW_STOCK_ALERT,
    channel: NotificationChannel.EMAIL,
    subject: '⚠️ Stock bajo: {{productName}}',
    body: `ALERTA INTERNA:\n\nEl producto *{{productName}}* (SKU: {{sku}}) tiene solo {{quantity}} unidades disponibles en la sucursal {{branchName}}.\n\nAcción requerida: Generar orden de compra.`,
  },
  {
    key: TemplateKey.LOW_STOCK_ALERT,
    channel: NotificationChannel.WHATSAPP,
    body: `⚠️ *Stock bajo*\n{{productName}} (SKU {{sku}}) — {{quantity}} u. en {{branchName}}.`,
  },
  {
    key: TemplateKey.LOW_STOCK_ALERT,
    channel: NotificationChannel.SMS,
    body: `Stock bajo: {{productName}} ({{sku}}) — {{quantity}} u. en {{branchName}}.`,
  },

  // ─── SHIFT CLOSING DISCREPANCY ─────────────────────────────────────────────
  {
    key: TemplateKey.SHIFT_CLOSING_DISCREPANCY,
    channel: NotificationChannel.EMAIL,
    subject: '🔴 Diferencia de caja detectada — {{branchName}}',
    body: `ALERTA DE GERENCIA:\n\nEl cajero {{cashierName}} cerró turno con una diferencia de $ {{difference}} en la caja {{registerName}}.\n\nEsperado: $ {{expected}}\nContado: $ {{actual}}\n\nRevise el turno en el sistema.`,
  },

  // ─── PURCHASE ORDER ISSUED ─────────────────────────────────────────────────
  {
    key: TemplateKey.PURCHASE_ORDER_ISSUED,
    channel: NotificationChannel.EMAIL,
    subject: 'Nueva Orden de Compra #{{orderId}}',
    body: `Hola {{supplierName}},\n\nAdjuntamos la orden de compra #{{orderId}} por un total de $ {{total}}.\nPor favor confirmar recepción y fecha estimada de entrega.\n\nSaludos,\n{{companyName}}`,
  },
  {
    key: TemplateKey.PURCHASE_ORDER_ISSUED,
    channel: NotificationChannel.WHATSAPP,
    body: `📦 *Orden de Compra #{{orderId}}*\nHola {{supplierName}}, enviamos OC por *$ {{total}}*.\nPor favor confirmá recepción.\n— {{companyName}}`,
  },
  {
    key: TemplateKey.PURCHASE_ORDER_ISSUED,
    channel: NotificationChannel.SMS,
    body: `OC #{{orderId}} por $ {{total}}. Confirmá recepción. — {{companyName}}`,
  },

  // ─── GOODS RECEIPT RECEIVED ────────────────────────────────────────────────
  {
    key: TemplateKey.GOODS_RECEIPT_RECEIVED,
    channel: NotificationChannel.EMAIL,
    subject: 'Recepción de mercadería registrada',
    body: `Se registró la recepción de mercadería para la OC #{{orderId}}.\nSucursal destino: {{branchName}}.\nFecha: {{date}}.`,
  },
  {
    key: TemplateKey.GOODS_RECEIPT_RECEIVED,
    channel: NotificationChannel.WHATSAPP,
    body: `📥 Recepción registrada para OC #{{orderId}} en {{branchName}} ({{date}}).`,
  },
  {
    key: TemplateKey.GOODS_RECEIPT_RECEIVED,
    channel: NotificationChannel.SMS,
    body: `Recepción OC #{{orderId}} en {{branchName}} — {{date}}.`,
  },

  // ─── TRANSFER DISPATCHED ───────────────────────────────────────────────────
  {
    key: TemplateKey.TRANSFER_DISPATCHED,
    channel: NotificationChannel.EMAIL,
    subject: 'Transferencia despachada — {{branchName}}',
    body: `Se despachó una transferencia de stock desde {{sourceBranch}} hacia {{destinationBranch}}.\nFecha: {{date}}.`,
  },
  {
    key: TemplateKey.TRANSFER_DISPATCHED,
    channel: NotificationChannel.WHATSAPP,
    body: `🚚 Transferencia despachada: {{sourceBranch}} → {{destinationBranch}} ({{date}}).`,
  },
  {
    key: TemplateKey.TRANSFER_DISPATCHED,
    channel: NotificationChannel.SMS,
    body: `Transferencia despachada {{sourceBranch}} → {{destinationBranch}}.`,
  },

  // ─── TRANSFER RECEIVED ─────────────────────────────────────────────────────
  {
    key: TemplateKey.TRANSFER_RECEIVED,
    channel: NotificationChannel.EMAIL,
    subject: 'Transferencia recibida — {{branchName}}',
    body: `Se confirmó la recepción de la transferencia en {{destinationBranch}}.\nFecha: {{date}}.`,
  },
  {
    key: TemplateKey.TRANSFER_RECEIVED,
    channel: NotificationChannel.WHATSAPP,
    body: `✅ Transferencia recibida en {{destinationBranch}} ({{date}}).`,
  },
  {
    key: TemplateKey.TRANSFER_RECEIVED,
    channel: NotificationChannel.SMS,
    body: `Transferencia recibida en {{destinationBranch}}.`,
  },

  // ─── INVOICE ISSUED ────────────────────────────────────────────────────────
  {
    key: TemplateKey.INVOICE_ISSUED,
    channel: NotificationChannel.EMAIL,
    subject: 'Factura electrónica emitida — #{{invoiceNumber}}',
    body: `Hola {{customerName}},\n\nTe adjuntamos la factura #{{invoiceNumber}} por un total de $ {{total}}.\nCAE: {{cae}}\n\nGracias.`,
  },

  // ─── RETURN APPROVED ───────────────────────────────────────────────────────
  {
    key: TemplateKey.RETURN_APPROVED,
    channel: NotificationChannel.EMAIL,
    subject: 'Devolución aprobada ✅',
    body: `Hola {{customerName}},\n\nTu solicitud de devolución fue aprobada.\nMonto a reintegrar: $ {{amount}}.\n\nNos comunicaremos para coordinar.`,
  },

  // ─── OVERDUE CURRENT ACCOUNT ───────────────────────────────────────────────
  {
    key: TemplateKey.OVERDUE_CURRENT_ACCOUNT,
    channel: NotificationChannel.WHATSAPP,
    body: `⚠️ *Aviso de Vencimiento*\nHola {{customerName}}, te informamos que tu cuenta corriente registra un saldo vencido de *$ {{overdueAmount}}*.\nPor favor, regulariza tu situación a la brevedad. Total adeudado: $ {{balance}}.\n\nIgnorá este mensaje si ya realizaste el pago.`,
  },

  // ─── MANUAL CURRENT ACCOUNT STATEMENT ─────────────────────────────────────
  {
    key: TemplateKey.MANUAL_CURRENT_ACCOUNT_STATEMENT,
    channel: NotificationChannel.WHATSAPP,
    body: `📄 *Resumen de Cuenta*\nHola {{customerName}}, te enviamos el estado actual de tu cuenta.\nSaldo total: *$ {{balance}}*.\nSaldo vencido: *$ {{overdueAmount}}*.\n\nAnte cualquier duda, estamos a disposición.`,
  },

  // ─── MANUAL SALE RECEIPT ───────────────────────────────────────────────────
  {
    key: TemplateKey.MANUAL_SALE_RECEIPT,
    channel: NotificationChannel.WHATSAPP,
    body: `🧾 *Comprobante de Venta*\nHola {{customerName}}, gracias por tu compra.\nTe enviamos el comprobante de la operación *#{{saleId}}* por un total de *$ {{total}}*.\n\nPuedes descargarlo aquí: {{receiptUrl}}`,
  },

  // ─── WELCOME CUSTOMER ──────────────────────────────────────────────────────
  {
    key: TemplateKey.WELCOME_CUSTOMER,
    channel: NotificationChannel.WHATSAPP,
    body: `👋 ¡Hola {{customerName}}! Bienvenido/a a nuestra tienda. Somos *{{storeName}}*. ¿En qué podemos ayudarte hoy?`,
  },

  // ─── OTP CODE ──────────────────────────────────────────────────────────────
  {
    key: TemplateKey.OTP_CODE,
    channel: NotificationChannel.WHATSAPP,
    body: `🔐 *Tu código de verificación es:*\n\n*{{otpCode}}*\n\nEste código expira en 10 minutos.\nSi no lo solicitaste, ignorá este mensaje.`,
  },
  {
    key: TemplateKey.OTP_CODE,
    channel: NotificationChannel.SMS,
    body: `Tu código de verificación es: {{otpCode}}. Expira en 10 minutos.`,
  },
  {
    key: TemplateKey.OTP_CODE,
    channel: NotificationChannel.EMAIL,
    subject: 'Tu código de verificación',
    body: `Tu código de verificación es: {{otpCode}}\n\nEste código expira en 10 minutos.\nSi no lo solicitaste, ignorá este mensaje.`,
  },
];
