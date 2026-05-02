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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordMovement(data) {
        if (data.quantity <= 0) {
            throw new common_1.BadRequestException('La cantidad del movimiento debe ser mayor a cero.');
        }
        return this.prisma.$transaction(async (tx) => {
            const movement = await tx.inventoryMovement.create({
                data: {
                    variantId: data.variantId,
                    sourceWarehouseId: data.sourceWarehouseId,
                    destinationWarehouseId: data.destinationWarehouseId,
                    type: data.type,
                    quantity: data.quantity,
                    unitCost: data.unitCost || 0,
                    referenceId: data.referenceId || null,
                },
            });
            if (data.sourceWarehouseId) {
                await this.updateStock(tx, data.variantId, data.sourceWarehouseId, data.branchId, data.type, -data.quantity);
            }
            if (data.destinationWarehouseId) {
                await this.updateStock(tx, data.variantId, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
            }
            return movement;
        });
    }
    async updateStock(tx, variantId, warehouseId, branchId, type, quantityChange) {
        let updateData = {};
        if (type === 'RESERVATION') {
            updateData = {
                reservedQuantity: { increment: Math.abs(quantityChange) },
                availableQuantity: { decrement: Math.abs(quantityChange) }
            };
        }
        else if (type === 'RESERVATION_RELEASE') {
            updateData = {
                reservedQuantity: { decrement: Math.abs(quantityChange) },
                availableQuantity: { increment: Math.abs(quantityChange) }
            };
        }
        else {
            updateData = {
                physicalQuantity: { increment: quantityChange },
                availableQuantity: { increment: quantityChange }
            };
        }
        return tx.stockLevel.upsert({
            where: { variantId_warehouseId: { variantId, warehouseId } },
            update: updateData,
            create: {
                variantId,
                warehouseId,
                branchId: branchId || undefined,
                physicalQuantity: quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : 0) : 0,
                availableQuantity: quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : -quantityChange) : 0,
                reservedQuantity: type === 'RESERVATION' ? Math.abs(quantityChange) : 0,
            }
        });
    }
    async reserveStock(variantId, warehouseId, branchId, quantity, orderId) {
        const stock = await this.prisma.stockLevel.findUnique({
            where: { variantId_warehouseId: { variantId, warehouseId } }
        });
        if (!stock || stock.availableQuantity < quantity) {
            throw new common_1.BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
        }
        return this.recordMovement({
            variantId,
            sourceWarehouseId: null,
            destinationWarehouseId: warehouseId,
            branchId,
            type: 'RESERVATION',
            quantity,
            referenceId: orderId
        });
    }
    async releaseReservation(variantId, warehouseId, branchId, quantity, orderId) {
        return this.recordMovement({
            variantId,
            sourceWarehouseId: warehouseId,
            destinationWarehouseId: null,
            branchId,
            type: 'RESERVATION_RELEASE',
            quantity,
            referenceId: orderId
        });
    }
    async getStockPerBranch(branchId, variantId) {
        return this.prisma.stockLevel.findMany({
            where: { branchId, ...(variantId ? { variantId } : {}) }
        });
    }
    async getStockPerWarehouse(warehouseId, variantId) {
        return this.prisma.stockLevel.findMany({
            where: { warehouseId, ...(variantId ? { variantId } : {}) }
        });
    }
    async adjustStock(dto) {
        const stock = await this.prisma.stockLevel.findUnique({
            where: { variantId_warehouseId: { variantId: dto.variantId, warehouseId: dto.warehouseId } },
            include: { warehouse: true }
        });
        let diff = 0;
        if (dto.type === 'ADD') {
            diff = dto.quantity;
        }
        else if (dto.type === 'SUBTRACT') {
            diff = -dto.quantity;
        }
        else if (dto.type === 'SET') {
            diff = dto.quantity - (stock?.availableQuantity || 0);
        }
        if (diff === 0)
            return stock;
        return this.recordMovement({
            variantId: dto.variantId,
            sourceWarehouseId: diff < 0 ? dto.warehouseId : null,
            destinationWarehouseId: diff > 0 ? dto.warehouseId : null,
            branchId: stock?.branchId || null,
            type: 'ADJUSTMENT',
            quantity: Math.abs(diff),
            referenceId: dto.reason
        });
    }
    async findAllStock(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.branchId)
            where.branchId = query.branchId;
        if (query.warehouseId)
            where.warehouseId = query.warehouseId;
        if (query.search) {
            where.variant = {
                OR: [
                    { sku: { contains: query.search, mode: 'insensitive' } },
                    { product: { name: { contains: query.search, mode: 'insensitive' } } }
                ]
            };
        }
        const [data, total] = await Promise.all([
            this.prisma.stockLevel.findMany({
                where,
                include: {
                    variant: { include: { product: true } },
                    warehouse: true,
                    branch: true
                },
                orderBy: { warehouseId: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.stockLevel.count({ where }),
        ]);
        const enriched = data.map(s => ({
            id: `${s.variantId}-${s.warehouseId}`,
            variantId: s.variantId,
            warehouseId: s.warehouseId,
            branchId: s.branchId,
            physicalQuantity: s.physicalQuantity,
            reservedQuantity: s.reservedQuantity,
            availableQuantity: s.availableQuantity,
            variantSku: s.variant?.sku || '',
            productName: s.variant?.product?.name || '',
            warehouseName: s.warehouse?.name || '',
            branchName: s.branch?.name || '',
            lastUpdated: s.updatedAt,
        }));
        return { data: enriched, total, page, pageSize };
    }
    async findAllMovements(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.warehouseId) {
            where.OR = [
                { sourceWarehouseId: query.warehouseId },
                { destinationWarehouseId: query.warehouseId }
            ];
        }
        if (query.variantId)
            where.variantId = query.variantId;
        const [data, total] = await Promise.all([
            this.prisma.inventoryMovement.findMany({
                where,
                include: {
                    variant: { include: { product: true } },
                    sourceWarehouse: true,
                    destinationWarehouse: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.inventoryMovement.count({ where }),
        ]);
        const enriched = data.map(m => ({
            ...m,
            variantSku: m.variant?.sku || '',
            productName: m.variant?.product?.name || '',
            sourceWarehouseName: m.sourceWarehouse?.name || '',
            destinationWarehouseName: m.destinationWarehouse?.name || '',
            warehouseName: m.destinationWarehouse?.name || m.sourceWarehouse?.name || '',
        }));
        return { data: enriched, total, page, pageSize };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map