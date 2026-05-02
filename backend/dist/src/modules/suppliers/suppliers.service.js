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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let SuppliersService = class SuppliersService {
    constructor() {
        this.suppliers = [];
        this.ledger = [];
    }
    async createSupplier(dto) {
        const supplier = {
            id: crypto.randomUUID(),
            companyName: dto.companyName,
            contactName: dto.contactName,
            taxId: dto.taxId,
            email: dto.email,
            phone: dto.phone,
            account: {
                balance: 0,
                currency: dto.currency,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.suppliers.push(supplier);
        return supplier;
    }
    async getSupplier(id) {
        const supplier = this.suppliers.find(s => s.id === id);
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        return supplier;
    }
    async registerInvoice(id, amount, invoiceNumber) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Invoice amount must be strictly positive.');
        const supplier = await this.getSupplier(id);
        supplier.account.balance += amount;
        supplier.updatedAt = new Date();
        await this.logLedger(id, 'INVOICE_RECEIVED', amount, invoiceNumber, `Recorded supplier invoice #${invoiceNumber}`);
        return supplier.account;
    }
    async processPayment(id, amount, paymentTransactionId) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Payment amount must be strictly positive.');
        const supplier = await this.getSupplier(id);
        supplier.account.balance -= amount;
        supplier.updatedAt = new Date();
        await this.logLedger(id, 'PAYMENT_SENT', -amount, paymentTransactionId, `Sent bank transfer. Ref: ${paymentTransactionId}`);
        return supplier.account;
    }
    async registerCreditNote(id, amount, creditNoteId) {
        if (amount <= 0)
            throw new common_1.BadRequestException('Credit note amount must be strictly positive.');
        const supplier = await this.getSupplier(id);
        supplier.account.balance -= amount;
        supplier.updatedAt = new Date();
        await this.logLedger(id, 'CREDIT_NOTE', -amount, creditNoteId, `Applied Credit Note ${creditNoteId} for returned goods`);
        return supplier.account;
    }
    async getSupplierLedger(id) {
        return this.ledger
            .filter(l => l.supplierId === id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async logLedger(supplierId, actionType, amount, referenceId, description) {
        const record = {
            id: crypto.randomUUID(),
            supplierId,
            actionType,
            amount,
            referenceId,
            description,
            createdAt: new Date(),
        };
        this.ledger.push(record);
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)()
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map