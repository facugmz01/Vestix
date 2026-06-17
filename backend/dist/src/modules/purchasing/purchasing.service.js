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
exports.PurchasingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const movement_type_enum_1 = require("../inventory/enums/movement-type.enum");
let PurchasingService = class PurchasingService {
    constructor(prisma, inventoryService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
    }
    async createPurchaseOrder(dto) {
        let totalAmount = 0;
        const lines = dto.lines.map(line => {
            const lineTotal = line.orderedQuantity * line.unitCost;
            totalAmount += lineTotal;
            return {
                variantId: line.variantId,
                orderedQuantity: line.orderedQuantity,
                unitCost: line.unitCost,
                totalAmount: lineTotal,
            };
        });
        return this.prisma.purchaseOrder.create({
            data: {
                supplierId: dto.supplierId,
                destinationWarehouseId: dto.destinationWarehouseId,
                status: 'ISSUED',
                totalAmount,
                notes: dto.notes,
                lines: {
                    create: lines,
                },
            },
        });
    }
    async receiveGoods(dto) {
        return this.prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.findUnique({
                where: { id: dto.purchaseOrderId },
                include: { lines: true },
            });
            if (!po)
                throw new common_1.BadRequestException('Purchase Order not found');
            if (po.status === 'COMPLETED')
                throw new common_1.BadRequestException('Purchase Order is already completed');
            const receiptLines = dto.lines.map(line => {
                const poLine = po.lines.find(l => l.variantId === line.variantId);
                return {
                    variantId: line.variantId,
                    poLineItemId: poLine?.id,
                    expectedQuantity: poLine ? (poLine.orderedQuantity - poLine.receivedQuantity) : 0,
                    receivedQuantity: line.receivedQuantity,
                };
            });
            const validReceiptLines = receiptLines.filter(l => l.poLineItemId);
            const receipt = await tx.goodsReceipt.create({
                data: {
                    purchaseOrderId: po.id,
                    destinationWarehouseId: po.destinationWarehouseId,
                    status: 'VALIDATED',
                    notes: dto.notes,
                    lines: {
                        create: validReceiptLines.map(l => ({
                            poLineItemId: l.poLineItemId,
                            variantId: l.variantId,
                            expectedQuantity: l.expectedQuantity,
                            receivedQuantity: l.receivedQuantity,
                            difference: l.receivedQuantity - l.expectedQuantity,
                        })),
                    },
                },
            });
            let allReceived = true;
            for (const line of po.lines) {
                const receivedInThisBatch = dto.lines.find(l => l.variantId === line.variantId)?.receivedQuantity || 0;
                const newReceivedTotal = line.receivedQuantity + receivedInThisBatch;
                if (receivedInThisBatch > 0) {
                    await tx.pOLineItem.update({
                        where: { id: line.id },
                        data: { receivedQuantity: newReceivedTotal },
                    });
                }
                if (newReceivedTotal < line.orderedQuantity) {
                    allReceived = false;
                }
            }
            await tx.purchaseOrder.update({
                where: { id: po.id },
                data: {
                    status: allReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
                },
            });
            for (const line of validReceiptLines) {
                const poLine = po.lines.find(l => l.id === line.poLineItemId);
                await this.inventoryService.recordMovement({
                    variantId: line.variantId,
                    quantity: line.receivedQuantity,
                    type: movement_type_enum_1.MovementType.GOODS_RECEIPT,
                    destinationWarehouseId: po.destinationWarehouseId,
                    unitCost: poLine?.unitCost || 0,
                    referenceId: receipt.id,
                }, tx);
            }
            return receipt;
        });
    }
    async findAllOrders(filters) {
        const { page = 1, pageSize = 15, search, status, supplierId } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search)
            where.id = { contains: search, mode: 'insensitive' };
        if (status)
            where.status = status;
        if (supplierId)
            where.supplierId = supplierId;
        const [data, total] = await Promise.all([
            this.prisma.purchaseOrder.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { supplier: true },
            }),
            this.prisma.purchaseOrder.count({ where }),
        ]);
        return { data, total, page: Number(page), pageSize: Number(pageSize) };
    }
    async findOneOrder(id) {
        return this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                lines: {
                    include: { variant: { include: { product: true } } },
                },
            },
        });
    }
    async findAllReceipts(filters) {
        const { page = 1, pageSize = 15, search, status } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search)
            where.id = { contains: search, mode: 'insensitive' };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.goodsReceipt.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { lines: true },
            }),
            this.prisma.goodsReceipt.count({ where }),
        ]);
        return { data, total, page: Number(page), pageSize: Number(pageSize) };
    }
    async findOneReceipt(id) {
        return this.prisma.goodsReceipt.findUnique({
            where: { id },
            include: {
                lines: {
                    include: { variant: { include: { product: true } } },
                },
            },
        });
    }
};
exports.PurchasingService = PurchasingService;
exports.PurchasingService = PurchasingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], PurchasingService);
//# sourceMappingURL=purchasing.service.js.map