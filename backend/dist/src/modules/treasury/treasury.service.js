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
exports.TreasuryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let TreasuryService = class TreasuryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActiveShift(userId) {
        return this.prisma.cashShift.findFirst({
            where: {
                openedByUserId: userId,
                status: 'OPEN',
            },
            include: {
                cashRegister: true,
            },
        });
    }
    async openShift(dto, userId) {
        const existing = await this.getActiveShift(userId);
        if (existing) {
            throw new common_1.BadRequestException('User already has an open shift');
        }
        const registerOpen = await this.prisma.cashShift.findFirst({
            where: {
                cashRegisterId: dto.cashRegisterId,
                status: 'OPEN',
            },
        });
        if (registerOpen) {
            throw new common_1.BadRequestException('Cash register is already open by another user');
        }
        return this.prisma.cashShift.create({
            data: {
                cashRegisterId: dto.cashRegisterId,
                openedByUserId: userId,
                openingAmount: dto.openingAmount,
                status: 'OPEN',
            },
        });
    }
    async closeShift(dto, userId) {
        return this.prisma.$transaction(async (tx) => {
            const shift = await tx.cashShift.findUnique({
                where: { id: dto.shiftId },
                include: { sales: true },
            });
            if (!shift)
                throw new common_1.BadRequestException('Shift not found');
            if (shift.status !== 'OPEN')
                throw new common_1.BadRequestException('Shift is already closed');
            if (shift.openedByUserId !== userId)
                throw new common_1.BadRequestException('You can only close your own shift');
            let cashSalesTotal = 0;
            for (const sale of shift.sales) {
                if (sale.paymentMethod === 'CASH') {
                    cashSalesTotal += sale.grandTotal;
                }
            }
            const expectedAmount = shift.openingAmount + cashSalesTotal;
            const difference = dto.closingAmount - expectedAmount;
            const closedShift = await tx.cashShift.update({
                where: { id: shift.id },
                data: {
                    status: 'CLOSED',
                    closedByUserId: userId,
                    closedAt: new Date(),
                    closingAmount: dto.closingAmount,
                    expectedAmount: expectedAmount,
                    difference: difference,
                    notes: dto.notes,
                },
            });
            return closedShift;
        });
    }
    async findAllShifts(filters) {
        const { page = 1, pageSize = 15, status } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.cashShift.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { openedAt: 'desc' },
                include: { cashRegister: true },
            }),
            this.prisma.cashShift.count({ where }),
        ]);
        return { data, total, page: Number(page), pageSize: Number(pageSize) };
    }
    async findOneShift(id) {
        return this.prisma.cashShift.findUnique({
            where: { id },
            include: {
                cashRegister: true,
                sales: true,
            },
        });
    }
    async getShiftMovements(shiftId) {
        return [];
    }
    async createMovement(shiftId, payload, userId) {
        throw new common_1.BadRequestException('Treasury movements are not implemented in the current schema version');
    }
};
exports.TreasuryService = TreasuryService;
exports.TreasuryService = TreasuryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TreasuryService);
//# sourceMappingURL=treasury.service.js.map