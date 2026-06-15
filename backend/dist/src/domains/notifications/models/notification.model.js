"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateKey = exports.NotificationStatus = exports.NotificationChannel = void 0;
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["WHATSAPP"] = "WHATSAPP";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["QUEUED"] = "QUEUED";
    NotificationStatus["SENDING"] = "SENDING";
    NotificationStatus["SENT"] = "SENT";
    NotificationStatus["FAILED"] = "FAILED";
    NotificationStatus["RETRYING"] = "RETRYING";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var TemplateKey;
(function (TemplateKey) {
    TemplateKey["ORDER_CONFIRMED"] = "ORDER_CONFIRMED";
    TemplateKey["ORDER_SHIPPED"] = "ORDER_SHIPPED";
    TemplateKey["ORDER_DELIVERED"] = "ORDER_DELIVERED";
    TemplateKey["PAYMENT_RECEIVED"] = "PAYMENT_RECEIVED";
    TemplateKey["LOW_STOCK_ALERT"] = "LOW_STOCK_ALERT";
    TemplateKey["SHIFT_CLOSING_DISCREPANCY"] = "SHIFT_CLOSING_DISCREPANCY";
    TemplateKey["WELCOME_CUSTOMER"] = "WELCOME_CUSTOMER";
    TemplateKey["OTP_CODE"] = "OTP_CODE";
    TemplateKey["PURCHASE_ORDER_ISSUED"] = "PURCHASE_ORDER_ISSUED";
    TemplateKey["GOODS_RECEIPT_RECEIVED"] = "GOODS_RECEIPT_RECEIVED";
    TemplateKey["TRANSFER_DISPATCHED"] = "TRANSFER_DISPATCHED";
    TemplateKey["TRANSFER_RECEIVED"] = "TRANSFER_RECEIVED";
    TemplateKey["INVOICE_ISSUED"] = "INVOICE_ISSUED";
    TemplateKey["RETURN_APPROVED"] = "RETURN_APPROVED";
    TemplateKey["OVERDUE_CURRENT_ACCOUNT"] = "OVERDUE_CURRENT_ACCOUNT";
    TemplateKey["MANUAL_CURRENT_ACCOUNT_STATEMENT"] = "MANUAL_CURRENT_ACCOUNT_STATEMENT";
    TemplateKey["MANUAL_SALE_RECEIPT"] = "MANUAL_SALE_RECEIPT";
})(TemplateKey || (exports.TemplateKey = TemplateKey = {}));
//# sourceMappingURL=notification.model.js.map