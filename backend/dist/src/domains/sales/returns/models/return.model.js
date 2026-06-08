"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnCondition = exports.ReturnAction = void 0;
var ReturnAction;
(function (ReturnAction) {
    ReturnAction["REFUND"] = "REFUND";
    ReturnAction["EXCHANGE"] = "EXCHANGE";
    ReturnAction["STORE_CREDIT"] = "STORE_CREDIT";
})(ReturnAction || (exports.ReturnAction = ReturnAction = {}));
var ReturnCondition;
(function (ReturnCondition) {
    ReturnCondition["SELLABLE"] = "SELLABLE";
    ReturnCondition["DAMAGED"] = "DAMAGED";
})(ReturnCondition || (exports.ReturnCondition = ReturnCondition = {}));
//# sourceMappingURL=return.model.js.map