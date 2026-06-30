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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
const movement_type_enum_1 = require("../inventory/enums/movement-type.enum");
let SalesService = class SalesService {
    constructor(prisma, inventoryService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
    }
    async createSale(dto) {
        return this.prisma.$transaction(async (tx) => {
            if (dto.id) {
                const existing = await tx.saleOrder.findUnique({ where: { id: dto.id }, include: { lines: true } });
                if (existing) {
                    return existing;
                }
            }
            let serverSubtotal = 0;
            const orderLines = [];
            for (const line of dto.lines) {
                const variant = await tx.productVariant.findUnique({
                    where: { id: line.variantId },
                    include: { product: true },
                });
                if (!variant) {
                    throw new common_1.BadRequestException(`Variant ${line.variantId} not found`);
                }
                const basePrice = line.unitPriceOverride ?? variant.basePrice;
                const discountAmount = basePrice * ((line.discountPct || 0) / 100);
                const lineTotal = (basePrice - discountAmount) * line.quantity;
                serverSubtotal += lineTotal;
                orderLines.push({
                    variantId: line.variantId,
                    categoryId: line.categoryId || variant.product.categoryId,
                    quantity: line.quantity,
                    basePrice: basePrice,
                    discountAmount: discountAmount * line.quantity,
                    finalPrice: lineTotal,
                    historicalSku: variant.sku,
                    historicalName: variant.product.name,
                    historicalCost: variant.costPrice,
                });
                await this.inventoryService.recordMovement({
                    variantId: line.variantId,
                    quantity: line.quantity,
                    type: movement_type_enum_1.MovementType.SALE,
                    sourceWarehouseId: dto.warehouseId,
                    unitCost: variant.costPrice,
                }, tx);
            }
            const serverGrandTotal = serverSubtotal - (dto.cartDiscountTotal || 0);
            const saleOrder = await tx.saleOrder.create({
                data: {
                    id: dto.id || (0, crypto_1.randomUUID)(),
                    branchId: dto.branchId,
                    warehouseId: dto.warehouseId,
                    customerId: dto.customerId,
                    cashShiftId: dto.cashShiftId,
                    source: dto.source || 'POS',
                    subtotal: serverSubtotal,
                    cartDiscountTotal: dto.cartDiscountTotal || 0,
                    grandTotal: serverGrandTotal,
                    status: dto.status || 'COMPLETED',
                    createdAt: dto.createdAtIso ? new Date(dto.createdAtIso) : new Date(),
                    paymentMethod: dto.paymentMethod || 'CASH',
                    paymentAccountId: dto.paymentAccountId,
                    lines: {
                        create: orderLines,
                    },
                },
            });
            const posTotal = dto.posGrandTotal ?? serverGrandTotal;
            if (Math.abs(serverGrandTotal - posTotal) > 0.01) {
                await tx.saleOrderVariance.create({
                    data: {
                        orderId: saleOrder.id,
                        posTotal: posTotal,
                        serverTotal: serverGrandTotal,
                        difference: serverGrandTotal - posTotal,
                        resolved: false,
                    },
                });
            }
            return saleOrder;
        });
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService])
], SalesService);
//# sourceMappingURL=sales.service.js.map