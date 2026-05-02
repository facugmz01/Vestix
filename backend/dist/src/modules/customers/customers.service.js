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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let CustomersService = class CustomersService {
    constructor() {
        this.customers = [];
        this.history = [];
    }
    async createCustomer(dto) {
        const customer = {
            id: crypto.randomUUID(),
            type: dto.type,
            fullName: dto.fullName,
            taxId: dto.taxId,
            email: dto.email,
            phone: dto.phone,
            credit: {
                limit: dto.creditLimit || 0,
                used: 0,
                available: dto.creditLimit || 0,
                onHold: false,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.customers.push(customer);
        await this.logHistory(customer.id, 'CUSTOMER_CREATED', customer.id, 'Customer profile initialized');
        return customer;
    }
    async getCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return customer;
    }
    async updateCreditLimit(id, newLimit, userId) {
        if (newLimit < 0)
            throw new common_1.BadRequestException('Credit limit cannot be negative.');
        const customer = await this.getCustomer(id);
        const oldLimit = customer.credit.limit;
        customer.credit.limit = newLimit;
        customer.credit.available = newLimit - customer.credit.used;
        if (customer.credit.available < 0) {
            customer.credit.onHold = true;
        }
        customer.updatedAt = new Date();
        await this.logHistory(id, 'CREDIT_LIMIT_CHANGED', id, `Limit safely changed from ${oldLimit} to ${newLimit} by user ${userId}`);
        return customer.credit;
    }
    async consumeCredit(id, amount, orderId) {
        const customer = await this.getCustomer(id);
        if (customer.credit.onHold) {
            throw new common_1.BadRequestException('Checkout blocked: Account is currently on financial hold.');
        }
        if (customer.credit.available < amount) {
            throw new common_1.BadRequestException(`Checkout blocked: Insufficient credit available. Reduce the order by $${amount - customer.credit.available} or request a limit increase.`);
        }
        customer.credit.used += amount;
        customer.credit.available -= amount;
        customer.updatedAt = new Date();
        await this.logHistory(id, 'CREDIT_CONSUMED', orderId, `Consumed $${amount} for order ${orderId}`);
        return customer.credit;
    }
    async repayCredit(id, amount, paymentReceiptId) {
        const customer = await this.getCustomer(id);
        if (amount <= 0)
            throw new common_1.BadRequestException('Repayment must be strictly positive.');
        customer.credit.used = Math.max(0, customer.credit.used - amount);
        customer.credit.available = customer.credit.limit - customer.credit.used;
        if (customer.credit.available >= 0 && customer.credit.onHold) {
            customer.credit.onHold = false;
        }
        customer.updatedAt = new Date();
        await this.logHistory(id, 'CREDIT_REPAYMENT', paymentReceiptId, `Repaid $${amount} via receipt ${paymentReceiptId}`);
        return customer.credit;
    }
    async getCustomerHistory(id) {
        return this.history
            .filter(h => h.customerId === id)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async logHistory(customerId, actionType, referenceId, description) {
        const record = {
            id: crypto.randomUUID(),
            customerId,
            actionType,
            referenceId,
            description,
            createdAt: new Date(),
        };
        this.history.push(record);
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)()
], CustomersService);
//# sourceMappingURL=customers.service.js.map