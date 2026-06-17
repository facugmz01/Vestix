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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const movement_type_enum_1 = require("../inventory/enums/movement-type.enum");
let TransfersService = class TransfersService {
    constructor(prisma, inventoryService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
    }
    async createTransfer(dto, userId) {
        if (dto.sourceWarehouseId === dto.destinationWarehouseId) {
            throw new common_1.BadRequestException('Source and destination cannot be the same');
        }
        return this.prisma.stockTransfer.create({
            data: {
                sourceWarehouseId: dto.sourceWarehouseId,
                destinationWarehouseId: dto.destinationWarehouseId,
                status: 'DRAFT',
                notes: dto.notes,
                requestedByUserId: userId,
                lines: {
                    create: dto.lines.map(line => ({
                        variantId: line.variantId,
                        quantity: line.quantity,
                    })),
                },
            },
        });
    }
    async dispatchTransfer(id) {
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id },
                include: { lines: true },
            });
            if (!transfer)
                throw new common_1.BadRequestException('Transfer not found');
            if (transfer.status !== 'DRAFT')
                throw new common_1.BadRequestException(`Cannot dispatch transfer in status ${transfer.status}`);
            const updatedTransfer = await tx.stockTransfer.update({
                where: { id },
                data: {
                    status: 'IN_TRANSIT',
                    dispatchedAt: new Date(),
                },
            });
            for (const line of transfer.lines) {
                const variant = await tx.productVariant.findUnique({ where: { id: line.variantId } });
                await this.inventoryService.recordMovement({
                    variantId: line.variantId,
                    quantity: line.quantity,
                    type: movement_type_enum_1.MovementType.TRANSFER_OUT,
                    sourceWarehouseId: transfer.sourceWarehouseId,
                    destinationWarehouseId: transfer.destinationWarehouseId,
                    unitCost: variant?.costPrice || 0,
                    referenceId: transfer.id,
                }, tx);
            }
            return updatedTransfer;
        });
    }
    async receiveTransfer(id, dto) {
        return this.prisma.$transaction(async (tx) => {
            const transfer = await tx.stockTransfer.findUnique({
                where: { id },
                include: { lines: true },
            });
            if (!transfer)
                throw new common_1.BadRequestException('Transfer not found');
            if (transfer.status !== 'IN_TRANSIT')
                throw new common_1.BadRequestException(`Cannot receive transfer in status ${transfer.status}`);
            const updatedTransfer = await tx.stockTransfer.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    receivedAt: new Date(),
                },
            });
            for (const receivedLine of dto.lines) {
                const transferLine = transfer.lines.find(l => l.variantId === receivedLine.variantId);
                if (!transferLine)
                    continue;
                await tx.stockTransferLine.update({
                    where: { id: transferLine.id },
                    data: { receivedQuantity: receivedLine.receivedQuantity },
                });
                if (receivedLine.receivedQuantity > 0) {
                    const variant = await tx.productVariant.findUnique({ where: { id: receivedLine.variantId } });
                    await this.inventoryService.recordMovement({
                        variantId: receivedLine.variantId,
                        quantity: receivedLine.receivedQuantity,
                        type: movement_type_enum_1.MovementType.TRANSFER_IN,
                        sourceWarehouseId: transfer.sourceWarehouseId,
                        destinationWarehouseId: transfer.destinationWarehouseId,
                        unitCost: variant?.costPrice || 0,
                        referenceId: transfer.id,
                    }, tx);
                }
            }
            return transfer;
        });
    }
    async findAll(filters) {
        const { page = 1, pageSize = 15, search, status } = filters;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (search)
            where.id = { contains: search, mode: 'insensitive' };
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.stockTransfer.findMany({
                where,
                skip,
                take: Number(pageSize),
                orderBy: { createdAt: 'desc' },
                include: { lines: true },
            }),
            this.prisma.stockTransfer.count({ where }),
        ]);
        return { data, total, page: Number(page), pageSize: Number(pageSize) };
    }
    async findOne(id) {
        return this.prisma.stockTransfer.findUnique({
            where: { id },
            include: {
                lines: {
                    include: { variant: { include: { product: true } } },
                },
            },
        });
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map