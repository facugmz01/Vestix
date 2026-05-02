"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentIntentStatus = exports.PaymentProvider = void 0;
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["MERCADO_PAGO"] = "MERCADO_PAGO";
    PaymentProvider["STRIPE"] = "STRIPE";
    PaymentProvider["CASH"] = "CASH";
    PaymentProvider["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentIntentStatus;
(function (PaymentIntentStatus) {
    PaymentIntentStatus["CREATED"] = "CREATED";
    PaymentIntentStatus["PENDING"] = "PENDING";
    PaymentIntentStatus["APPROVED"] = "APPROVED";
    PaymentIntentStatus["REJECTED"] = "REJECTED";
    PaymentIntentStatus["REFUNDED"] = "REFUNDED";
})(PaymentIntentStatus || (exports.PaymentIntentStatus = PaymentIntentStatus = {}));
//# sourceMappingURL=payment.model.js.map