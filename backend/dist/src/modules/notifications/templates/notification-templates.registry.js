"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_TEMPLATES = void 0;
const notification_model_1 = require("../models/notification.model");
exports.NOTIFICATION_TEMPLATES = [
    {
        key: notification_model_1.TemplateKey.ORDER_CONFIRMED,
        channel: notification_model_1.NotificationChannel.EMAIL,
        subject: 'Tu pedido #{{orderId}} fue confirmado ✅',
        body: `Hola {{customerName}},\n\nRecibimos tu pedido #{{orderId}} por $ {{total}}.\nEstaremos preparándolo pronto.\n\nGracias por tu compra.`,
    },
    {
        key: notification_model_1.TemplateKey.ORDER_CONFIRMED,
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
        key: notification_model_1.TemplateKey.WELCOME_CUSTOMER,
        channel: notification_model_1.NotificationChannel.WHATSAPP,
        body: `👋 ¡Hola {{customerName}}! Bienvenido/a a nuestra tienda. Somos *{{storeName}}*. ¿En qué podemos ayudarte hoy?`,
    },
];
//# sourceMappingURL=notification-templates.registry.js.map