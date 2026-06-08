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
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory.service");
const inventory_movement_model_1 = require("../models/inventory-movement.model");
const transfer_model_1 = require("./models/transfer.model");
let TransfersService = class TransfersService {
    constructor(prisma, inventoryLedger) {
        this.prisma = prisma;
        this.inventoryLedger = inventoryLedger;
    }
    async createTransfer(data) {
        if (data.sourceWarehouseId === data.destinationWarehouseId) {
            throw new common_1.BadRequestException('Source and destination warehouses must be distinct.');
        }
        for (const line of data.lines) {
            const stockArr = await this.inventoryLedger.getStockPerWarehouse(data.sourceWarehouseId, line.variantId);
            const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
            if (available < line.quantity) {
                throw new common_1.BadRequestException(`Insufficient available stock for variant ${line.variantId} in the source warehouse.`);
            }
        }
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                sourceWarehouseId: data.sourceWarehouseId,
                destinationWarehouseId: data.destinationWarehouseId,
                status: transfer_model_1.TransferStatus.DRAFT,
                lines: {
                    create: data.lines.map(line => ({
                        variantId: line.variantId,
                        quantity: line.quantity,
                    })),
                },
            },
            include: {
                lines: {
                    include: {
                        variant: true,
                    },
                },
            },
        });
        return transfer;
    }
    async dispatchTransfer(transferId, options) {
        const transfer = await this.prisma.stockTransfer.findUnique({
            where: { id: transferId },
            include: { lines: true },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== transfer_model_1.TransferStatus.DRAFT) {
            throw new common_1.BadRequestException('Only DRAFT transfers can be dispatched.');
        }
        for (const line of transfer.lines) {
            const stockArr = await this.inventoryLedger.getStockPerWarehouse(transfer.sourceWarehouseId, line.variantId);
            const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
            if (available < line.quantity) {
                throw new common_1.BadRequestException(`Dispatch Failed: Stock for variant ${line.variantId} was consumed by a sale before dispatch.`);
            }
            await this.inventoryLedger.recordMovement({
                variantId: line.variantId,
                sourceWarehouseId: transfer.sourceWarehouseId,
                destinationWarehouseId: null,
                branchId: null,
                type: inventory_movement_model_1.MovementType.TRANSFER_OUT,
                quantity: line.quantity,
                referenceId: `TRF-${transfer.id}`,
            });
        }
        return this.prisma.stockTransfer.update({
            where: { id: transferId },
            data: {
                status: transfer_model_1.TransferStatus.IN_TRANSIT,
                trackingNumber: options?.trackingNumber || null,
                dispatchedAt: new Date(),
            },
            include: {
                lines: {
                    include: {
                        variant: true,
                    },
                },
            },
        });
    }
    async receiveTransfer(transferId, data) {
        const transfer = await this.prisma.stockTransfer.findUnique({
            where: { id: transferId },
            include: { lines: true },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== transfer_model_1.TransferStatus.IN_TRANSIT) {
            throw new common_1.BadRequestException('Only IN_TRANSIT transfers can be received.');
        }
        const destWarehouse = await this.prisma.warehouse.findUnique({
            where: { id: transfer.destinationWarehouseId },
        });
        if (!destWarehouse)
            throw new common_1.NotFoundException('Destination warehouse not found');
        const destinationBranchId = destWarehouse.branchId;
        for (const item of data.lines) {
            await this.inventoryLedger.recordMovement({
                variantId: item.variantId,
                sourceWarehouseId: null,
                destinationWarehouseId: transfer.destinationWarehouseId,
                branchId: destinationBranchId,
                type: inventory_movement_model_1.MovementType.TRANSFER_IN,
                quantity: item.receivedQuantity,
                referenceId: `TRF-${transfer.id}`,
            });
            const line = transfer.lines.find(l => l.variantId === item.variantId);
            if (line) {
                await this.prisma.stockTransferLine.update({
                    where: { id: line.id },
                    data: { receivedQuantity: item.receivedQuantity },
                });
            }
        }
        return this.prisma.stockTransfer.update({
            where: { id: transferId },
            data: {
                status: transfer_model_1.TransferStatus.COMPLETED,
                receivedAt: new Date(),
            },
            include: {
                lines: {
                    include: {
                        variant: true,
                    },
                },
            },
        });
    }
    async cancelTransfer(transferId) {
        const transfer = await this.prisma.stockTransfer.findUnique({
            where: { id: transferId },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== transfer_model_1.TransferStatus.DRAFT) {
            throw new common_1.BadRequestException('Cannot cancel a transfer that is already dispatched. File a return or shrinkage instead.');
        }
        return this.prisma.stockTransfer.update({
            where: { id: transferId },
            data: {
                status: transfer_model_1.TransferStatus.CANCELLED,
            },
        });
    }
    async findAll(query) {
        const page = Number(query.page) || 1;
        const pageSize = Number(query.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.status) {
            where.status = query.status;
        }
        if (query.search) {
            where.OR = [
                { id: { contains: query.search, mode: 'insensitive' } },
                { trackingNumber: { contains: query.search, mode: 'insensitive' } },
                { notes: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.stockTransfer.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    sourceWarehouse: true,
                    destinationWarehouse: true,
                    lines: {
                        include: {
                            variant: true,
                        },
                    },
                },
            }),
            this.prisma.stockTransfer.count({ where }),
        ]);
        const formattedData = data.map(t => ({
            ...t,
            sourceWarehouseName: t.sourceWarehouse?.name,
            destinationWarehouseName: t.destinationWarehouse?.name,
        }));
        return { data: formattedData, total };
    }
    async findOne(id) {
        const transfer = await this.prisma.stockTransfer.findUnique({
            where: { id },
            include: {
                sourceWarehouse: true,
                destinationWarehouse: true,
                lines: {
                    include: {
                        variant: true,
                    },
                },
            },
        });
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        return {
            ...transfer,
            sourceWarehouseName: transfer.sourceWarehouse?.name,
            destinationWarehouseName: transfer.destinationWarehouse?.name,
        };
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map