"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictStrategy = exports.SyncStatus = exports.SyncOperationType = void 0;
var SyncOperationType;
(function (SyncOperationType) {
    SyncOperationType["CHECKOUT"] = "CHECKOUT";
    SyncOperationType["RETURN"] = "RETURN";
    SyncOperationType["CASH_MOVEMENT"] = "CASH_MOVEMENT";
    SyncOperationType["STOCK_COUNT"] = "STOCK_COUNT";
})(SyncOperationType || (exports.SyncOperationType = SyncOperationType = {}));
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "PENDING";
    SyncStatus["PROCESSING"] = "PROCESSING";
    SyncStatus["APPLIED"] = "APPLIED";
    SyncStatus["CONFLICT"] = "CONFLICT";
    SyncStatus["REJECTED"] = "REJECTED";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
var ConflictStrategy;
(function (ConflictStrategy) {
    ConflictStrategy["SERVER_WINS"] = "SERVER_WINS";
    ConflictStrategy["CLIENT_WINS"] = "CLIENT_WINS";
    ConflictStrategy["MANAGER_REVIEW"] = "MANAGER_REVIEW";
})(ConflictStrategy || (exports.ConflictStrategy = ConflictStrategy = {}));
//# sourceMappingURL=sync-operation.model.js.map