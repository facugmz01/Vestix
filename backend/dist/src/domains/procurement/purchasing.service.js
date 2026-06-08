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
var PurchasingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const stock_movement_service_1 = require("../logistics/stock-movement.service");
let PurchasingService = PurchasingService_1 = class PurchasingService {
    constructor(prisma, stockMovementService) {
        this.prisma = prisma;
        this.stockMovementService = stockMovementService;
        this.logger = new common_1.Logger(PurchasingService_1.name);
    }
    async createPO(dto) {
        try {
            const totalAmount = (dto.lines || []).reduce((sum, l) => sum + (l.orderedQuantity * l.unitCost), 0);
            return await this.prisma.purchaseOrder.create({
                data: {
                    supplierId: dto.supplierId,
                    destinationWarehouseId: dto.destinationWarehouseId,
                    status: 'DRAFT',
                    totalAmount: totalAmount,
                    paidAmount: 0,
                    currency: dto.currency || 'ARS',
                    notes: dto.notes,
                    lines: {
                        create: (dto.lines || []).map(l => ({
                            variantId: l.variantId,
                            orderedQuantity: l.orderedQuantity,
                            unitCost: l.unitCost,
                            totalAmount: l.orderedQuantity * l.unitCost
                        }))
                    }
                },
                include: { lines: true }
            });
        }
        catch (error) {
            this.logger.error(`Error creating PO: ${error.message}`, error.stack);
            throw new common_1.BadRequestException('Error al crear la orden de compra. Verificá los datos o sincronizá la base de datos.');
        }
    }
    async processDirectPurchase(dto) {
        const totalAmount = dto.lines.reduce((sum, l) => sum + (l.quantity * l.unitCost) - (l.discountAmount || 0), 0);
        const paidAmount = dto.paymentAmount || 0;
        return this.prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.create({
                data: {
                    supplierId: dto.supplierId,
                    destinationWarehouseId: dto.warehouseId,
                    status: 'ISSUED',
                    totalAmount,
                    paidAmount,
                    completedAt: null,
                    notes: dto.notes,
                    lines: {
                        create: dto.lines.map(l => ({
                            variantId: l.variantId,
                            orderedQuantity: l.quantity,
                            receivedQuantity: 0,
                            unitCost: l.unitCost,
                            discountAmount: l.discountAmount || 0,
                            totalAmount: (l.quantity * l.unitCost) - (l.discountAmount || 0)
                        }))
                    }
                },
                include: { lines: true }
            });
            const remainingDebt = totalAmount - paidAmount;
            await tx.supplier.update({
                where: { id: dto.supplierId },
                data: { balance: { increment: remainingDebt } }
            });
            if (paidAmount > 0 && dto.paymentAccountId) {
                await tx.financialTransaction.create({
                    data: {
                        accountId: dto.paymentAccountId,
                        type: 'CREDIT',
                        amount: paidAmount,
                        referenceId: po.id,
                        description: `Pago a proveedor por compra ${po.id}`
                    }
                });
                await tx.financialAccount.update({
                    where: { id: dto.paymentAccountId },
                    data: { balance: { decrement: paidAmount } }
                });
            }
            return po;
        });
    }
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 50;
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
                include: { supplier: true, lines: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.purchaseOrder.count(),
        ]);
        return { data, total, page, pageSize };
    }
    async getPO(id) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(id)) {
            return this.prisma.purchaseOrder.findUnique({
                where: { id },
                include: {
                    supplier: true,
                    lines: { include: { variant: { include: { product: true } } } }
                }
            });
        }
        return this.prisma.purchaseOrder.findFirst({
            where: { id: { startsWith: id } },
            include: {
                supplier: true,
                lines: { include: { variant: { include: { product: true } } } }
            }
        });
    }
    async applyReceiptToPO(poId, receiptLines) {
        return this.prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { id: poId },
                include: { lines: true }
            });
            if (!po)
                return;
            for (const receipt of receiptLines) {
                await tx.pOLineItem.update({
                    where: { id: receipt.poLineItemId },
                    data: { receivedQuantity: { increment: receipt.receivedQuantity } }
                });
            }
            const updatedPo = await tx.purchaseOrder.findUnique({
                where: { id: poId },
                include: { lines: true }
            });
            const allFullyReceived = updatedPo.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
            await tx.purchaseOrder.update({
                where: { id: poId },
                data: {
                    status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
                    completedAt: allFullyReceived ? new Date() : undefined
                }
            });
        });
    }
    async updatePO(id, dto) {
        const po = await this.getPO(id);
        if (!po)
            throw new common_1.NotFoundException('Orden de compra no encontrada');
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Solo se pueden editar órdenes en borrador');
        return this.prisma.$transaction(async (tx) => {
            await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
            const totalAmount = (dto.lines || []).reduce((sum, l) => sum + (l.orderedQuantity * l.unitCost), 0);
            return tx.purchaseOrder.update({
                where: { id },
                data: {
                    destinationWarehouseId: dto.destinationWarehouseId,
                    notes: dto.notes,
                    totalAmount,
                    lines: {
                        create: (dto.lines || []).map((l) => ({
                            variantId: l.variantId,
                            orderedQuantity: l.orderedQuantity,
                            unitCost: l.unitCost,
                            totalAmount: l.orderedQuantity * l.unitCost
                        }))
                    }
                },
                include: { lines: true }
            });
        });
    }
    async removePO(id) {
        const po = await this.getPO(id);
        if (!po)
            throw new common_1.NotFoundException('Orden de compra no encontrada');
        if (po.status !== 'DRAFT')
            throw new common_1.BadRequestException('Solo se pueden borrar órdenes en borrador');
        return this.prisma.$transaction(async (tx) => {
            await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
            return tx.purchaseOrder.delete({ where: { id } });
        });
    }
};
exports.PurchasingService = PurchasingService;
exports.PurchasingService = PurchasingService = PurchasingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService])
], PurchasingService);
//# sourceMappingURL=purchasing.service.js.map