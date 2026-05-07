"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let AccountsService = class AccountsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAccount(dto) {
        return this.prisma.financialAccount.create({
            data: {
                name: dto.name,
                type: dto.type,
                currency: dto.currency,
                branchId: dto.branchId,
                balance: 0,
                isActive: true,
            }
        });
    }
    async getAccount(id) {
        const acc = await this.prisma.financialAccount.findUnique({
            where: { id },
            include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } }
        });
        if (!acc)
            throw new common_1.NotFoundException('Cuenta financiera no encontrada');
        return acc;
    }
    async getAccounts() {
        return this.prisma.financialAccount.findMany({
            where: { isActive: true }
        });
    }
    async getPaymentMethods() {
        return this.prisma.paymentMethod.findMany({
            where: { isActive: true },
            include: {
                account: true,
                cashRegister: true,
            }
        });
    }
    async createPaymentMethod(data) {
        return this.prisma.paymentMethod.create({
            data: {
                name: data.name,
                type: data.type,
                accountId: data.accountId,
                cashRegisterId: data.cashRegisterId,
                isActive: true,
            }
        });
    }
    async updatePaymentMethod(id, data) {
        return this.prisma.paymentMethod.update({
            where: { id },
            data,
        });
    }
    async postTransaction(accountId, type, amount, referenceId, description) {
        if (amount <= 0)
            throw new common_1.BadRequestException('El monto debe ser positivo');
        return this.prisma.$transaction(async (tx) => {
            const account = await tx.financialAccount.findUnique({ where: { id: accountId } });
            if (!account)
                throw new common_1.NotFoundException('Cuenta no encontrada');
            const transaction = await tx.financialTransaction.create({
                data: {
                    accountId,
                    type,
                    amount,
                    referenceId,
                    description,
                }
            });
            const balanceChange = type === 'DEBIT' ? amount : -amount;
            await tx.financialAccount.update({
                where: { id: accountId },
                data: { balance: { increment: balanceChange } }
            });
            return transaction;
        });
    }
    async generateIncomingReceipt(payload) {
        await this.postTransaction(payload.accountId, 'DEBIT', payload.amount, payload.referenceId, payload.description);
        return this.prisma.paymentReceipt.create({
            data: {
                accountId: payload.accountId,
                amount: payload.amount,
                payerName: payload.payerName,
                referenceId: payload.referenceId,
            }
        });
    }
    async processOutgoingPayment(payload) {
        const account = await this.getAccount(payload.accountId);
        if (account.type === 'CASH' && account.balance < payload.amount) {
            throw new common_1.BadRequestException(`Fondos insuficientes en la caja. Saldo: $${account.balance}`);
        }
        await this.postTransaction(payload.accountId, 'CREDIT', payload.amount, payload.referenceId, payload.description);
        return { success: true, message: `Pago procesado: $${payload.amount}` };
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map