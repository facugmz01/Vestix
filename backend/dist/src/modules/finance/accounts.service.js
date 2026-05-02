"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const account_model_1 = require("./models/account.model");
const crypto = __importStar(require("crypto"));
let AccountsService = class AccountsService {
    constructor() {
        this.accounts = [];
        this.transactions = [];
        this.receipts = [];
    }
    async createAccount(dto) {
        const account = {
            id: crypto.randomUUID(),
            ...dto,
            balance: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.accounts.push(account);
        return account;
    }
    async getAccount(id) {
        const acc = this.accounts.find(a => a.id === id);
        if (!acc)
            throw new common_1.NotFoundException('Financial Account not found');
        return acc;
    }
    async postTransaction(accountId, type, amount, referenceId, description) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Transaction amounts must be strictly positive.');
        }
        const account = await this.getAccount(accountId);
        const transaction = {
            id: crypto.randomUUID(),
            accountId,
            type,
            amount,
            referenceId,
            description,
            createdAt: new Date(),
        };
        this.transactions.push(transaction);
        if (type === account_model_1.TransactionType.DEBIT) {
            account.balance += amount;
        }
        else {
            account.balance -= amount;
        }
        account.updatedAt = new Date();
        return transaction;
    }
    async generateIncomingReceipt(payload) {
        await this.postTransaction(payload.accountId, account_model_1.TransactionType.DEBIT, payload.amount, payload.referenceId, payload.description);
        const receipt = {
            id: crypto.randomUUID(),
            accountId: payload.accountId,
            amount: payload.amount,
            payerName: payload.payerName,
            referenceId: payload.referenceId,
            issuedAt: new Date()
        };
        this.receipts.push(receipt);
        return receipt;
    }
    async processOutgoingPayment(payload) {
        const account = await this.getAccount(payload.accountId);
        if (account.type === account_model_1.AccountType.CASH && account.balance < payload.amount) {
            throw new common_1.BadRequestException(`Insufficient funds in Cash Drawer. Current balance is $${account.balance}, but attempted to pay $${payload.amount}.`);
        }
        await this.postTransaction(payload.accountId, account_model_1.TransactionType.CREDIT, payload.amount, payload.referenceId, payload.description);
        return { success: true, message: `Paid $${payload.amount} to ${payload.payeeName}` };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)()
], AccountsService);
//# sourceMappingURL=accounts.service.js.map