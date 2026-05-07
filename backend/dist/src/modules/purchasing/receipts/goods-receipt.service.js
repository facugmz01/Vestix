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
exports.GoodsReceiptService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const purchasing_service_1 = require("../purchasing.service");
const stock_movement_service_1 = require("../../inventory/stock-movement.service");
let GoodsReceiptService = class GoodsReceiptService {
    constructor(prisma, purchasingService, stockMovementService) {
        this.prisma = prisma;
        this.purchasingService = purchasingService;
        this.stockMovementService = stockMovementService;
    }
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 50;
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.prisma.goodsReceipt.findMany({
                include: { lines: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.goodsReceipt.count(),
        ]);
        return { data, total, page, pageSize };
    }
    async findOne(id) {
        return this.prisma.goodsReceipt.findUnique({
            where: { id },
            include: { lines: true }
        });
    }
    async draftReceipt(payload) {
        const po = await this.purchasingService.getPO(payload.purchaseOrderId);
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        let hasDifferences = false;
        const lineData = [];
        for (const scan of payload.scannedItems) {
            const poLine = po.lines.find(l => l.id === scan.poLineItemId);
            if (!poLine)
                throw new common_1.BadRequestException(`Line item ${scan.poLineItemId} does not belong to PO ${po.id}`);
            const expected = poLine.orderedQuantity - poLine.receivedQuantity;
            const difference = scan.quantity - expected;
            if (difference !== 0)
                hasDifferences = true;
            lineData.push({
                poLineItemId: scan.poLineItemId,
                variantId: scan.variantId,
                expectedQuantity: expected,
                receivedQuantity: scan.quantity,
                difference,
                notes: difference > 0 ? 'Overshipment' : (difference < 0 ? 'Short shipment' : undefined),
            });
        }
        return this.prisma.goodsReceipt.create({
            data: {
                purchaseOrderId: po.id,
                destinationWarehouseId: po.destinationWarehouseId,
                receivedByUserId: payload.receivedByUserId,
                status: hasDifferences ? 'DISPUTED' : 'DRAFT',
                notes: payload.notes,
                lines: {
                    create: lineData
                }
            },
            include: { lines: true }
        });
    }
    async validateReceipt(receiptId, branchId, approvedByUserId) {
        return this.prisma.$transaction(async (tx) => {
            const receipt = await tx.goodsReceipt.findUnique({
                where: { id: receiptId },
                include: { lines: { include: { poLineItem: true } } }
            });
            if (!receipt)
                throw new common_1.NotFoundException('Goods Receipt not found');
            if (receipt.status === 'VALIDATED')
                throw new common_1.ConflictException('Already validated');
            if (receipt.status === 'DISPUTED' && !approvedByUserId) {
                throw new common_1.BadRequestException('Disputed receipt requires manager approval');
            }
            for (const line of receipt.lines) {
                await this.stockMovementService.processGoodsReceipt({
                    variantId: line.variantId,
                    destinationWarehouseId: receipt.destinationWarehouseId,
                    branchId: branchId,
                    quantity: line.receivedQuantity,
                    purchaseCost: line.poLineItem.unitCost,
                    purchaseOrderId: receipt.purchaseOrderId,
                });
                await tx.pOLineItem.update({
                    where: { id: line.poLineItemId },
                    data: { receivedQuantity: { increment: line.receivedQuantity } }
                });
            }
            const updatedPo = await tx.purchaseOrder.findUnique({
                where: { id: receipt.purchaseOrderId },
                include: { lines: true }
            });
            const allFullyReceived = updatedPo.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
            await tx.purchaseOrder.update({
                where: { id: receipt.purchaseOrderId },
                data: {
                    status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
                    completedAt: allFullyReceived ? new Date() : undefined
                }
            });
            return tx.goodsReceipt.update({
                where: { id: receiptId },
                data: {
                    status: 'VALIDATED',
                    receivedByUserId: approvedByUserId || receipt.receivedByUserId
                },
                include: { lines: true }
            });
        });
    }
};
exports.GoodsReceiptService = GoodsReceiptService;
exports.GoodsReceiptService = GoodsReceiptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        purchasing_service_1.PurchasingService,
        stock_movement_service_1.StockMovementService])
], GoodsReceiptService);
//# sourceMappingURL=goods-receipt.service.js.map