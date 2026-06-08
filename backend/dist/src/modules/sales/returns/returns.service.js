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
exports.ReturnsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const create_return_dto_1 = require("./dto/create-return.dto");
let ReturnsService = class ReturnsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReturns(params) {
        const page = parseInt(params.page) || 1;
        const pageSize = parseInt(params.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const { search, status } = params;
        const where = {};
        if (status)
            where.status = status;
        if (search && search.trim() !== '') {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { saleOrder: { id: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.saleReturn.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: { lines: true, saleOrder: { include: { customer: true } } }
            }),
            this.prisma.saleReturn.count({ where })
        ]);
        return {
            data: data.map(r => ({
                ...r,
                customerName: r.saleOrder?.customer?.fullName || 'Consumidor Final',
                totalRefundAmount: r.totalRefundAmount
            })),
            total
        };
    }
    async getReturnById(id) {
        const r = await this.prisma.saleReturn.findUnique({
            where: { id },
            include: {
                lines: { include: { orderLine: { include: { variant: { include: { product: true } } } } } },
                saleOrder: { include: { customer: true } }
            }
        });
        if (!r)
            throw new common_1.NotFoundException('Return record not found');
        return r;
    }
    async processReturn(dto) {
        const sale = await this.prisma.saleOrder.findUnique({
            where: { id: dto.saleOrderId },
            include: { lines: true, customer: true }
        });
        if (!sale)
            throw new common_1.NotFoundException('Original sale not found');
        return this.prisma.$transaction(async (tx) => {
            let totalRefund = 0;
            const saleReturn = await tx.saleReturn.create({
                data: {
                    saleOrderId: dto.saleOrderId,
                    branchId: dto.branchId,
                    action: dto.action,
                    status: 'APPROVED',
                    totalRefundAmount: 0,
                }
            });
            for (const item of dto.items) {
                const orderLine = sale.lines.find(l => l.id === item.orderLineId);
                if (!orderLine)
                    throw new common_1.BadRequestException(`Line ${item.orderLineId} not found in original sale`);
                if (item.quantity > orderLine.quantity)
                    throw new common_1.BadRequestException(`Cannot return more than purchased`);
                const lineRefundAmount = orderLine.finalPrice * item.quantity;
                totalRefund += lineRefundAmount;
                await tx.saleReturnLine.create({
                    data: {
                        returnId: saleReturn.id,
                        orderLineId: item.orderLineId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: orderLine.basePrice,
                        condition: item.condition,
                        reason: item.reason
                    }
                });
                if (item.condition === 'SELLABLE') {
                    const targetWarehouseId = sale.warehouseId;
                    if (targetWarehouseId) {
                        await tx.inventoryMovement.create({
                            data: {
                                variantId: item.variantId,
                                destinationWarehouseId: targetWarehouseId,
                                type: 'SALE_RETURN',
                                quantity: item.quantity,
                                unitCost: orderLine.basePrice,
                                referenceId: saleReturn.id
                            }
                        });
                        await tx.stockLevel.upsert({
                            where: { variantId_warehouseId: { variantId: item.variantId, warehouseId: targetWarehouseId } },
                            create: {
                                variantId: item.variantId,
                                warehouseId: targetWarehouseId,
                                branchId: sale.branchId,
                                physicalQuantity: item.quantity,
                                availableQuantity: item.quantity
                            },
                            update: {
                                physicalQuantity: { increment: item.quantity },
                                availableQuantity: { increment: item.quantity }
                            }
                        });
                    }
                }
            }
            if (dto.action === create_return_dto_1.ReturnAction.STORE_CREDIT && sale.customerId) {
                await tx.customer.update({
                    where: { id: sale.customerId },
                    data: { usedCredit: { decrement: totalRefund } }
                });
            }
            else {
                let accountId = sale.paymentAccountId;
                if (!accountId) {
                    const defaultAccount = await tx.financialAccount.findFirst({
                        where: { isActive: true },
                        orderBy: { createdAt: 'asc' }
                    });
                    accountId = defaultAccount?.id;
                }
                if (!accountId) {
                    throw new common_1.BadRequestException('No existe ninguna cuenta de tesorería configurada para procesar el reembolso. Por favor, cree una caja o cuenta bancaria primero.');
                }
                await tx.treasuryReceipt.create({
                    data: {
                        accountId,
                        amount: -totalRefund,
                        payerName: sale.customer?.fullName || 'Consumidor Final',
                        referenceId: saleReturn.id,
                        description: `Refund for Sale ${sale.id.split('-')[0]}`
                    }
                });
            }
            return tx.saleReturn.update({
                where: { id: saleReturn.id },
                data: { totalRefundAmount: totalRefund },
                include: { lines: true }
            });
        });
    }
};
exports.ReturnsService = ReturnsService;
exports.ReturnsService = ReturnsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReturnsService);
//# sourceMappingURL=returns.service.js.map