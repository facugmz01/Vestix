"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceStatus = exports.InvoiceType = void 0;
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["FACTURA_A"] = "FACTURA_A";
    InvoiceType["FACTURA_B"] = "FACTURA_B";
    InvoiceType["FACTURA_C"] = "FACTURA_C";
    InvoiceType["NOTA_CREDITO_A"] = "NOTA_CREDITO_A";
    InvoiceType["NOTA_CREDITO_B"] = "NOTA_CREDITO_B";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["PENDING_AFIP"] = "PENDING_AFIP";
    InvoiceStatus["APPROVED"] = "APPROVED";
    InvoiceStatus["REJECTED"] = "REJECTED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
//# sourceMappingURL=invoice.model.js.map