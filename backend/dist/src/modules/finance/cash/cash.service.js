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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashService = void 0;
const common_1 = require("@nestjs/common");
const cash_register_model_1 = require("./models/cash-register.model");
const accounts_service_1 = require("../accounts.service");
const account_model_1 = require("../models/account.model");
const crypto = __importStar(require("crypto"));
let CashService = class CashService {
    constructor(accountsService) {
        this.accountsService = accountsService;
        this.shifts = [];
    }
    async openShift(accountId, userId, reportedOpeningBalance) {
        const account = await this.accountsService.getAccount(accountId);
        if (account.type !== account_model_1.AccountType.CASH) {
            throw new common_1.BadRequestException('Shifts can only be opened on physical CASH accounts.');
        }
        const activeShift = this.shifts.find(s => s.accountId === accountId && s.status === cash_register_model_1.ShiftStatus.OPEN);
        if (activeShift) {
            throw new common_1.BadRequestException('A shift is already open for this register.');
        }
        if (reportedOpeningBalance !== account.balance) {
            console.warn(`WARNING: Opening balance discrepancy. System expects ${account.balance}, Cashier reported ${reportedOpeningBalance}`);
        }
        const shift = {
            id: crypto.randomUUID(),
            accountId,
            openedByUserId: userId,
            status: cash_register_model_1.ShiftStatus.OPEN,
            openingBalance: reportedOpeningBalance,
            openedAt: new Date(),
        };
        this.shifts.push(shift);
        return shift;
    }
    async recordExpense(accountId, amount, description, userId) {
        this.ensureShiftIsOpen(accountId);
        await this.accountsService.postTransaction(accountId, account_model_1.TransactionType.CREDIT, amount, `EXP-${crypto.randomUUID()}`, `Cash Expense by ${userId}: ${description}`);
        return { success: true, message: `Expense of $${amount} recorded.` };
    }
    async performCashDrop(sourceAccountId, destinationAccountId, amount, userId) {
        this.ensureShiftIsOpen(sourceAccountId);
        const source = await this.accountsService.getAccount(sourceAccountId);
        if (source.balance < amount) {
            throw new common_1.BadRequestException('Cannot drop more cash than is currently in the drawer.');
        }
        await this.accountsService.postTransaction(sourceAccountId, account_model_1.TransactionType.CREDIT, amount, `DROP-${crypto.randomUUID()}`, `Cash Drop by ${userId} to Safe`);
        await this.accountsService.postTransaction(destinationAccountId, account_model_1.TransactionType.DEBIT, amount, `DROP-${crypto.randomUUID()}`, `Received Cash Drop from Register ${source.name}`);
        return { success: true, amount };
    }
    async closeShift(accountId, userId, actualCountedBalance) {
        const shift = this.shifts.find(s => s.accountId === accountId && s.status === cash_register_model_1.ShiftStatus.OPEN);
        if (!shift) {
            throw new common_1.BadRequestException('No open shift found for this register.');
        }
        const account = await this.accountsService.getAccount(accountId);
        const expected = account.balance;
        const difference = actualCountedBalance - expected;
        shift.status = cash_register_model_1.ShiftStatus.CLOSED;
        shift.closedByUserId = userId;
        shift.expectedClosingBalance = expected;
        shift.actualClosingBalance = actualCountedBalance;
        shift.difference = difference;
        shift.closedAt = new Date();
        if (difference < 0) {
            await this.accountsService.postTransaction(accountId, account_model_1.TransactionType.CREDIT, Math.abs(difference), `SHORT-${shift.id}`, `Shift Closing Shortage. Expected: ${expected}, Counted: ${actualCountedBalance}`);
        }
        else if (difference > 0) {
            await this.accountsService.postTransaction(accountId, account_model_1.TransactionType.DEBIT, Math.abs(difference), `OVER-${shift.id}`, `Shift Closing Overage. Expected: ${expected}, Counted: ${actualCountedBalance}`);
        }
        return shift;
    }
    ensureShiftIsOpen(accountId) {
        const activeShift = this.shifts.find(s => s.accountId === accountId && s.status === cash_register_model_1.ShiftStatus.OPEN);
        if (!activeShift) {
            throw new common_1.BadRequestException('SECURITY BLOCK: A shift must be OPEN to perform this operation. The register is locked.');
        }
    }
};
exports.CashService = CashService;
exports.CashService = CashService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], CashService);
//# sourceMappingURL=cash.service.js.map