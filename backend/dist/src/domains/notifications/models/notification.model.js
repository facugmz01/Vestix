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
})(TemplateKey || (exports.TemplateKey = TemplateKey = {}));
//# sourceMappingURL=notification.model.js.map