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
const movement_type_enum_1 = require("./enums/movement-type.enum");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordMovement(dto, externalTx) {
        const execute = async (tx) => {
            this.validateMovementLogic(dto);
            const movement = await tx.inventoryMovement.create({
                data: {
                    variantId: dto.variantId,
                    type: dto.type,
                    quantity: dto.quantity,
                    unitCost: dto.unitCost || 0,
                    sourceWarehouseId: dto.sourceWarehouseId,
                    destinationWarehouseId: dto.destinationWarehouseId,
                    referenceId: dto.referenceId,
                    batchId: dto.batchId,
                },
            });
            if (dto.sourceWarehouseId) {
                await this.decrementStock(tx, dto.variantId, dto.sourceWarehouseId, dto.quantity, dto.batchId);
            }
            if (dto.destinationWarehouseId) {
                await this.incrementStock(tx, dto.variantId, dto.destinationWarehouseId, dto.quantity, dto.batchId);
            }
            return movement;
        };
        if (externalTx) {
            return execute(externalTx);
        }
        else {
            return this.prisma.$transaction(execute);
        }
    }
    validateMovementLogic(dto) {
        if ([movement_type_enum_1.MovementType.SALE, movement_type_enum_1.MovementType.TRANSFER_OUT, movement_type_enum_1.MovementType.SHRINKAGE].includes(dto.type) &&
            !dto.sourceWarehouseId) {
            throw new common_1.BadRequestException(`Source warehouse is required for ${dto.type}`);
        }
        if ([
            movement_type_enum_1.MovementType.GOODS_RECEIPT,
            movement_type_enum_1.MovementType.SALE_RETURN,
            movement_type_enum_1.MovementType.TRANSFER_IN,
            movement_type_enum_1.MovementType.POS_CORRECTION,
        ].includes(dto.type) &&
            !dto.destinationWarehouseId) {
            throw new common_1.BadRequestException(`Destination warehouse is required for ${dto.type}`);
        }
    }
    async incrementStock(tx, variantId, warehouseId, quantity, batchId) {
        const existing = await tx.stockLevel.findUnique({
            where: {
                variantId_warehouseId_batchId: {
                    variantId,
                    warehouseId,
                    batchId: batchId || '',
                },
            },
        });
        const stock = await tx.stockLevel.findFirst({
            where: {
                variantId,
                warehouseId,
                batchId: batchId || null,
            },
        });
        if (stock) {
            await tx.stockLevel.update({
                where: { id: stock.id },
                data: {
                    physicalQuantity: { increment: quantity },
                    availableQuantity: { increment: quantity },
                },
            });
        }
        else {
            await tx.stockLevel.create({
                data: {
                    variantId,
                    warehouseId,
                    batchId: batchId || null,
                    physicalQuantity: quantity,
                    availableQuantity: quantity,
                },
            });
        }
    }
    async decrementStock(tx, variantId, warehouseId, quantity, batchId) {
        const stock = await tx.stockLevel.findFirst({
            where: {
                variantId,
                warehouseId,
                batchId: batchId || null,
            },
        });
        if (!stock || stock.physicalQuantity < quantity) {
            throw new common_1.BadRequestException(`Insufficient stock for variant ${variantId} in warehouse ${warehouseId}`);
        }
        await tx.stockLevel.update({
            where: { id: stock.id },
            data: {
                physicalQuantity: { decrement: quantity },
                availableQuantity: { decrement: quantity },
            },
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map