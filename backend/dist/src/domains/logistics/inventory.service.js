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
const settings_service_1 = require("../../modules/settings/settings.service");
let InventoryService = class InventoryService {
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
    }
    async recordMovement(data, tx) {
        if (data.quantity <= 0) {
            throw new common_1.BadRequestException('La cantidad del movimiento debe ser mayor a cero.');
        }
        const execute = async (transaction) => {
            const movement = await transaction.inventoryMovement.create({
                data: {
                    variantId: data.variantId,
                    batchId: data.batchId || null,
                    sourceWarehouseId: data.sourceWarehouseId,
                    destinationWarehouseId: data.destinationWarehouseId,
                    type: data.type,
                    quantity: data.quantity,
                    unitCost: data.unitCost || 0,
                    referenceId: data.referenceId || null,
                },
            });
            if (data.sourceWarehouseId) {
                await this.updateStock(transaction, data.variantId, data.batchId || null, data.sourceWarehouseId, data.branchId, data.type, -data.quantity);
            }
            if (data.destinationWarehouseId) {
                await this.updateStock(transaction, data.variantId, data.batchId || null, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
            }
            return movement;
        };
        if (tx) {
            return execute(tx);
        }
        return this.prisma.$transaction(async (t) => {
            return execute(t);
        });
    }
    async updateStock(tx, variantId, batchId, warehouseId, branchId, type, quantityChange) {
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
        else if (type === 'CONSUME_RESERVATION') {
            updateData = {
                reservedQuantity: { decrement: Math.abs(quantityChange) },
                physicalQuantity: { decrement: Math.abs(quantityChange) }
            };
        }
        else {
            updateData = {
                physicalQuantity: { increment: quantityChange },
                availableQuantity: { increment: quantityChange }
            };
        }
        if (quantityChange < 0 && type !== 'CONSUME_RESERVATION') {
            const posSettings = await this.settingsService.getPosSettings();
            if (!posSettings.allowNegativeStock) {
                const stock = await tx.stockLevel.findFirst({
                    where: { variantId, warehouseId, batchId: batchId || null }
                });
                const currentAvailable = stock ? stock.availableQuantity : 0;
                if (currentAvailable + quantityChange < 0) {
                    throw new common_1.BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
                }
            }
        }
        return tx.stockLevel.upsert({
            where: { variantId_warehouseId_batchId: { variantId, warehouseId, batchId } },
            update: updateData,
            create: {
                variantId,
                warehouseId,
                batchId,
                branchId: branchId || undefined,
                physicalQuantity: type === 'CONSUME_RESERVATION' ? -Math.abs(quantityChange) : (quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : 0) : 0),
                availableQuantity: type === 'CONSUME_RESERVATION' ? 0 : (quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : -quantityChange) : 0),
                reservedQuantity: type === 'RESERVATION' ? Math.abs(quantityChange) : 0,
            }
        });
    }
    async reserveStock(variantId, warehouseId, branchId, quantity, orderId, tx) {
        const prismaClient = tx || this.prisma;
        const stock = await prismaClient.stockLevel.findFirst({
            where: { variantId, warehouseId },
            orderBy: { availableQuantity: 'desc' }
        });
        const posSettings = await this.settingsService.getPosSettings();
        if (!posSettings.allowNegativeStock) {
            if (!stock || stock.availableQuantity < quantity) {
                throw new common_1.BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
            }
        }
        const movement = await this.recordMovement({
            variantId,
            sourceWarehouseId: null,
            destinationWarehouseId: warehouseId,
            branchId,
            type: 'RESERVATION',
            quantity,
            referenceId: orderId
        }, tx);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        await prismaClient.stockReservation.create({
            data: {
                stockLevelId: stock.id,
                variantId,
                warehouseId,
                quantity,
                orderId,
                status: 'ACTIVE',
                expiresAt
            }
        });
        return movement;
    }
    async releaseReservation(variantId, warehouseId, branchId, quantity, orderId, tx) {
        const prismaClient = tx || this.prisma;
        const reservation = await prismaClient.stockReservation.findFirst({
            where: {
                orderId,
                variantId,
                warehouseId,
                status: 'ACTIVE'
            }
        });
        if (reservation) {
            await prismaClient.stockReservation.update({
                where: { id: reservation.id },
                data: { status: 'CANCELLED' }
            });
        }
        return this.recordMovement({
            variantId,
            sourceWarehouseId: warehouseId,
            destinationWarehouseId: null,
            branchId,
            type: 'RESERVATION_RELEASE',
            quantity,
            referenceId: orderId
        }, tx);
    }
    async consumeReservation(variantId, warehouseId, branchId, quantity, orderId, tx) {
        const prismaClient = tx || this.prisma;
        const reservation = await prismaClient.stockReservation.findFirst({
            where: {
                orderId,
                variantId,
                warehouseId,
                status: 'ACTIVE'
            }
        });
        if (reservation) {
            await prismaClient.stockReservation.update({
                where: { id: reservation.id },
                data: { status: 'CONSUMED' }
            });
        }
        return this.recordMovement({
            variantId,
            sourceWarehouseId: warehouseId,
            destinationWarehouseId: null,
            branchId,
            type: 'CONSUME_RESERVATION',
            quantity,
            referenceId: orderId
        }, tx);
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
        const stock = await this.prisma.stockLevel.findFirst({
            where: { variantId: dto.variantId, warehouseId: dto.warehouseId },
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
    async processStockAudit(data) {
        const { warehouseId, items } = data;
        const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
        if (!warehouse)
            throw new common_1.BadRequestException('Warehouse not found');
        return this.prisma.$transaction(async (tx) => {
            let adjustmentCount = 0;
            for (const item of items) {
                let variantId = item.variantId;
                if (!variantId && item.sku) {
                    const variant = await tx.productVariant.findUnique({ where: { sku: item.sku } });
                    if (!variant)
                        continue;
                    variantId = variant.id;
                }
                if (!variantId)
                    continue;
                const stockLevel = await tx.stockLevel.findFirst({
                    where: { variantId, warehouseId, batchId: item.batchId || null }
                });
                const currentPhysical = stockLevel?.physicalQuantity || 0;
                const difference = item.countedQuantity - currentPhysical;
                if (difference !== 0) {
                    adjustmentCount++;
                    await this.recordMovement({
                        variantId: variantId,
                        batchId: item.batchId || null,
                        sourceWarehouseId: difference < 0 ? warehouseId : null,
                        destinationWarehouseId: difference > 0 ? warehouseId : null,
                        branchId: warehouse.branchId,
                        type: 'STOCK_TAKE_ADJUSTMENT',
                        quantity: Math.abs(difference),
                    }, tx);
                }
            }
            return { success: true, adjustmentsMade: adjustmentCount };
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map