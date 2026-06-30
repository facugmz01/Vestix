"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooCommerceEvent = exports.SyncJobStatus = exports.SyncDirection = void 0;
var SyncDirection;
(function (SyncDirection) {
    SyncDirection["INBOUND"] = "INBOUND";
    SyncDirection["OUTBOUND"] = "OUTBOUND";
})(SyncDirection || (exports.SyncDirection = SyncDirection = {}));
var SyncJobStatus;
(function (SyncJobStatus) {
    SyncJobStatus["QUEUED"] = "QUEUED";
    SyncJobStatus["PROCESSING"] = "PROCESSING";
    SyncJobStatus["COMPLETED"] = "COMPLETED";
    SyncJobStatus["FAILED"] = "FAILED";
    SyncJobStatus["RETRYING"] = "RETRYING";
})(SyncJobStatus || (exports.SyncJobStatus = SyncJobStatus = {}));
var WooCommerceEvent;
(function (WooCommerceEvent) {
    WooCommerceEvent["ORDER_CREATED"] = "woocommerce_new_order";
    WooCommerceEvent["ORDER_STATUS_UPDATED"] = "woocommerce_order_status_changed";
    WooCommerceEvent["PRODUCT_UPDATED"] = "woocommerce_product_updated";
})(WooCommerceEvent || (exports.WooCommerceEvent = WooCommerceEvent = {}));
//# sourceMappingURL=sync-job.model.js.map