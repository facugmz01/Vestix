"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TEMPLATES = void 0;
const notification_model_1 = require("../models/notification.model");
exports.NOTIFICATION_TEMPLATES = [
    {
        key: notification_model_1.TemplateKey.SALE_CONFIRMED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Tu pedido #{{orderId}} fue confirmado ✅',
        body: `Hola {{customerName}},\n\nRecibimos tu pedido #{{orderId}} por $ {{total}}.\nEstaremos preparándolo pronto.\n\nGracias por tu compra.`,
    },
    {
        key: notification_model_1.TemplateKey.SALE_CONFIRMED,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `✅ *Pedido confirmado*\nHola {{customerName}}! Recibimos tu pedido *#{{orderId}}* por *$ {{total}}*. Te avisaremos cuando esté en camino. 🛍️`,
    },
    {
        key: notification_model_1.TemplateKey.ORDER_SHIPPED,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `🚚 *¡Tu pedido está en camino!*\nHola {{customerName}}, tu pedido *#{{orderId}}* fue despachado con *{{courierName}}*.\nTracking: {{trackingNumber}}`,
    },
    {
        key: notification_model_1.TemplateKey.ORDER_SHIPPED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Tu pedido #{{orderId}} fue enviado 🚚',
        body: `Hola {{customerName}},\n\nTu pedido viaja con {{courierName}}.\nNúmero de seguimiento: {{trackingNumber}}\n\n¡Que lo disfrutes!`,
    },
    {
        key: notification_model_1.TemplateKey.PAYMENT_RECEIVED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Pago recibido por $ {{amount}} 💳',
        body: `Hola {{customerName}},\n\nAcreditamos tu pago de $ {{amount}} para la orden #{{orderId}}.\nComprobante: {{receiptId}}`,
    },
    {
        key: notification_model_1.TemplateKey.LOW_STOCK_ALERT,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: '⚠️ Stock bajo: {{productName}}',
        body: `ALERTA INTERNA:\n\nEl producto *{{productName}}* (SKU: {{sku}}) tiene solo {{quantity}} unidades disponibles en la sucursal {{branchName}}.\n\nAcción requerida: Generar orden de compra.`,
    },
    {
        key: notification_model_1.TemplateKey.SHIFT_CLOSING_DISCREPANCY,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: '🔴 Diferencia de caja detectada — {{branchName}}',
        body: `ALERTA DE GERENCIA:\n\nEl cajero {{cashierName}} cerró turno con una diferencia de $ {{difference}} en la caja {{registerName}}.\n\nEsperado: $ {{expected}}\nContado: $ {{actual}}\n\nRevise el turno en el sistema.`,
    },
    {
        key: notification_model_1.TemplateKey.PURCHASE_ORDER_ISSUED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Nueva Orden de Compra #{{orderId}}',
        body: `Hola {{supplierName}},\n\nAdjuntamos la orden de compra #{{orderId}} por un total de $ {{total}}.\nPor favor confirmar recepción y fecha estimada de entrega.\n\nSaludos,\n{{companyName}}`,
    },
    {
        key: notification_model_1.TemplateKey.GOODS_RECEIPT_RECEIVED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Recepción de mercadería registrada',
        body: `Se registró la recepción de mercadería para la OC #{{orderId}}.\nSucursal destino: {{branchName}}.\nFecha: {{date}}.`,
    },
    {
        key: notification_model_1.TemplateKey.TRANSFER_DISPATCHED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Transferencia despachada — {{branchName}}',
        body: `Se despachó una transferencia de stock desde {{sourceBranch}} hacia {{destinationBranch}}.\nFecha: {{date}}.`,
    },
    {
        key: notification_model_1.TemplateKey.TRANSFER_RECEIVED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Transferencia recibida — {{branchName}}',
        body: `Se confirmó la recepción de la transferencia en {{destinationBranch}}.\nFecha: {{date}}.`,
    },
    {
        key: notification_model_1.TemplateKey.INVOICE_ISSUED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Factura electrónica emitida — #{{invoiceNumber}}',
        body: `Hola {{customerName}},\n\nTe adjuntamos la factura #{{invoiceNumber}} por un total de $ {{total}}.\nCAE: {{cae}}\n\nGracias.`,
    },
    {
        key: notification_model_1.TemplateKey.RETURN_APPROVED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Devolución aprobada ✅',
        body: `Hola {{customerName}},\n\nTu solicitud de devolución fue aprobada.\nMonto a reintegrar: $ {{amount}}.\n\nNos comunicaremos para coordinar.`,
    },
    {
        key: notification_model_1.TemplateKey.OVERDUE_CURRENT_ACCOUNT,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `⚠️ *Aviso de Vencimiento*\nHola {{customerName}}, te informamos que tu cuenta corriente registra un saldo vencido de *$ {{overdueAmount}}*.\nPor favor, regulariza tu situación a la brevedad. Total adeudado: $ {{balance}}.\n\nIgnorá este mensaje si ya realizaste el pago.`,
    },
    {
        key: notification_model_1.TemplateKey.MANUAL_CURRENT_ACCOUNT_STATEMENT,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `📄 *Resumen de Cuenta*\nHola {{customerName}}, te enviamos el estado actual de tu cuenta.\nSaldo total: *$ {{balance}}*.\nSaldo vencido: *$ {{overdueAmount}}*.\n\nAnte cualquier duda, estamos a disposición.`,
    },
    {
        key: notification_model_1.TemplateKey.MANUAL_SALE_RECEIPT,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `🧾 *Comprobante de Venta*\nHola {{customerName}}, gracias por tu compra.\nTe enviamos el comprobante de la operación *#{{saleId}}* por un total de *$ {{total}}*.\n\nPuedes descargarlo aquí: {{receiptUrl}}`,
    },
    {
        key: notification_model_1.TemplateKey.WELCOME_CUSTOMER,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `👋 ¡Hola {{customerName}}! Bienvenido/a a nuestra tienda. Somos *{{storeName}}*. ¿En qué podemos ayudarte hoy?`,
    },
    {
        key: notification_model_1.TemplateKey.OTP_CODE,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `🔐 *Tu código de verificación es:*\n\n*{{otpCode}}*\n\nEste código expira en 10 minutos.\nSi no lo solicitaste, ignorá este mensaje.`,
    },
];
//# sourceMappingURL=notification-templates.registry.js.map