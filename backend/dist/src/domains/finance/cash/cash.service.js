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
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const accounts_service_1 = require("../accounts.service");
const crypto = __importStar(require("crypto"));
let CashService = class CashService {
    constructor(prisma, accountsService) {
        this.prisma = prisma;
        this.accountsService = accountsService;
    }
    async getActiveShift(cashRegisterId) {
        return this.prisma.cashShift.findFirst({
            where: {
                cashRegisterId,
                status: 'OPEN',
            },
            include: {
                openedByUser: { select: { id: true, fullName: true, email: true } },
            }
        });
    }
    async getActiveShiftForUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { branch: { include: { cashRegisters: true } } }
        });
        if (!user || !user.branch || user.branch.cashRegisters.length === 0) {
            throw new common_1.BadRequestException('El usuario no tiene una sucursal o caja asignada.');
        }
        const cashRegister = user.branch.cashRegisters[0];
        return this.getActiveShift(cashRegister.id);
    }
    async openShift(cashRegisterId, userId, reportedOpeningBalance) {
        const register = await this.prisma.cashRegister.findUnique({ where: { id: cashRegisterId } });
        if (!register)
            throw new common_1.NotFoundException('Caja registradora no encontrada.');
        const activeShift = await this.getActiveShift(cashRegisterId);
        if (activeShift) {
            throw new common_1.BadRequestException('Ya existe un turno abierto para esta caja.');
        }
        return this.prisma.cashShift.create({
            data: {
                cashRegisterId,
                openedByUserId: userId,
                status: 'OPEN',
                openingAmount: reportedOpeningBalance,
                openedAt: new Date(),
            }
        });
    }
    async closeShift(shiftId, userId, actualCountedBalance, notes) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: { cashRegister: { include: { paymentMethods: { include: { account: true } } } } }
        });
        if (!shift) {
            throw new common_1.NotFoundException('Turno no encontrado.');
        }
        if (shift.status === 'CLOSED') {
            throw new common_1.BadRequestException('El turno ya se encuentra cerrado.');
        }
        const cashPaymentMethod = shift.cashRegister.paymentMethods.find(p => p.type === 'CASH');
        const cashAccountId = cashPaymentMethod?.accountId;
        let expected = shift.openingAmount;
        if (cashAccountId) {
            const transactions = await this.prisma.financialTransaction.findMany({
                where: {
                    accountId: cashAccountId,
                    createdAt: { gte: shift.openedAt }
                }
            });
            const netCashFlow = transactions.reduce((sum, tx) => {
                return sum + (tx.type === 'DEBIT' ? tx.amount : -tx.amount);
            }, 0);
            expected += netCashFlow;
        }
        const difference = actualCountedBalance - expected;
        const closedShift = await this.prisma.cashShift.update({
            where: { id: shiftId },
            data: {
                status: 'CLOSED',
                closedByUserId: userId,
                closingAmount: actualCountedBalance,
                expectedAmount: expected,
                difference: difference,
                closedAt: new Date(),
                notes,
            }
        });
        if (difference !== 0 && cashAccountId) {
            const adjustmentType = difference < 0 ? 'CREDIT' : 'DEBIT';
            await this.accountsService.postTransaction(cashAccountId, adjustmentType, Math.abs(difference), `SHIFT-ADJ-${shift.id}`, `Ajuste de Cierre de Caja (Arqueo). Esperado: ${expected}, Contado: ${actualCountedBalance}`);
        }
        return closedShift;
    }
    async recordExpense(accountId, amount, description, userId) {
        await this.accountsService.postTransaction(accountId, 'CREDIT', amount, `EXP-${crypto.randomUUID()}`, `Cash Expense by ${userId}: ${description}`);
        return { success: true, message: `Expense of $${amount} recorded.` };
    }
    async performCashDrop(sourceAccountId, destinationAccountId, amount, userId) {
        const source = await this.accountsService.getAccount(sourceAccountId);
        if (source.balance < amount) {
            throw new common_1.BadRequestException('Cannot drop more cash than is currently in the drawer.');
        }
        await this.accountsService.postTransaction(sourceAccountId, 'CREDIT', amount, `DROP-${crypto.randomUUID()}`, `Cash Drop by ${userId} to Safe`);
        await this.accountsService.postTransaction(destinationAccountId, 'DEBIT', amount, `DROP-${crypto.randomUUID()}`, `Received Cash Drop from Register ${source.name}`);
        return { success: true, amount };
    }
    async getShifts(page, pageSize) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.cashShift.findMany({
                skip,
                take: pageSize,
                orderBy: { openedAt: 'desc' },
                include: {
                    openedByUser: { select: { fullName: true } },
                    closedByUser: { select: { fullName: true } },
                    cashRegister: { select: { name: true, branch: { select: { name: true } } } }
                }
            }),
            this.prisma.cashShift.count()
        ]);
        return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }
    async getShiftById(shiftId) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: {
                openedByUser: { select: { fullName: true } },
                closedByUser: { select: { fullName: true } },
                cashRegister: { select: { name: true, branch: { select: { name: true } } } }
            }
        });
        if (!shift)
            throw new common_1.NotFoundException('Turno no encontrado');
        return shift;
    }
    async getShiftMovements(shiftId) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: { cashRegister: { include: { paymentMethods: true } } }
        });
        if (!shift)
            throw new common_1.NotFoundException('Turno no encontrado');
        const cashPaymentMethod = shift.cashRegister.paymentMethods.find(p => p.type === 'CASH');
        if (!cashPaymentMethod?.accountId)
            return [];
        const end = shift.closedAt || new Date();
        const transactions = await this.prisma.financialTransaction.findMany({
            where: {
                accountId: cashPaymentMethod.accountId,
                createdAt: { gte: shift.openedAt, lte: end }
            },
            orderBy: { createdAt: 'desc' }
        });
        return transactions.map(t => ({
            id: t.id,
            type: t.type === 'DEBIT' ? 'INCOME' : 'EXPENSE',
            concept: t.description || t.referenceId,
            amount: t.amount,
            createdAt: t.createdAt
        }));
    }
    async addManualMovement(shiftId, userId, type, amount, concept) {
        const shift = await this.prisma.cashShift.findUnique({
            where: { id: shiftId },
            include: { cashRegister: { include: { paymentMethods: true } } }
        });
        if (!shift)
            throw new common_1.NotFoundException('Turno no encontrado');
        if (shift.status === 'CLOSED')
            throw new common_1.BadRequestException('El turno está cerrado');
        const cashPaymentMethod = shift.cashRegister.paymentMethods.find(p => p.type === 'CASH');
        if (!cashPaymentMethod?.accountId)
            throw new common_1.BadRequestException('No hay cuenta de efectivo asociada a esta caja');
        const txType = type === 'INCOME' ? 'DEBIT' : 'CREDIT';
        await this.accountsService.postTransaction(cashPaymentMethod.accountId, txType, amount, `MANUAL-${crypto.randomUUID()}`, concept);
        return { success: true };
    }
};
exports.CashService = CashService;
exports.CashService = CashService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        accounts_service_1.AccountsService])
], CashService);
//# sourceMappingURL=cash.service.js.map