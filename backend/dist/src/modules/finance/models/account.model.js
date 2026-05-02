"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = exports.AccountType = void 0;
var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "CASH";
    AccountType["BANK"] = "BANK";
    AccountType["CREDIT_CARD"] = "CREDIT_CARD";
    AccountType["EXPENSE"] = "EXPENSE";
    AccountType["REVENUE"] = "REVENUE";
})(AccountType || (exports.AccountType = AccountType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEBIT"] = "DEBIT";
    TransactionType["CREDIT"] = "CREDIT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
//# sourceMappingURL=account.model.js.map