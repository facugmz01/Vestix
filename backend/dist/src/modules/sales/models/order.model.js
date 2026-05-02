"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentMethod = exports.OrderSource = void 0;
var OrderSource;
(function (OrderSource) {
    OrderSource["POS"] = "POS";
    OrderSource["ECOMMERCE"] = "ECOMMERCE";
})(OrderSource || (exports.OrderSource = OrderSource = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["CUSTOMER_CREDIT"] = "CUSTOMER_CREDIT";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
//# sourceMappingURL=order.model.js.map