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
const uuid_1 = require("uuid");
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
    async bulkImportPurchases(dto) {
        return this.prisma.$transaction(async (tx) => {
            const groupedOrders = {};
            for (const row of dto.rows) {
                if (!groupedOrders[row.orderId]) {
                    groupedOrders[row.orderId] = [];
                }
                groupedOrders[row.orderId].push(row);
            }
            let createdCount = 0;
            let errorCount = 0;
            const errors = [];
            for (const [externalOrderId, lines] of Object.entries(groupedOrders)) {
                try {
                    const firstLine = lines[0];
                    let supplierId = null;
                    if (firstLine.supplierIdentifier) {
                        const ident = firstLine.supplierIdentifier.trim();
                        const supplier = await tx.supplier.findFirst({
                            where: {
                                OR: [
                                    { email: { equals: ident, mode: 'insensitive' } },
                                    { taxId: ident },
                                    { companyName: { equals: ident, mode: 'insensitive' } }
                                ]
                            }
                        });
                        if (supplier) {
                            supplierId = supplier.id;
                        }
                        else {
                            const newSup = await tx.supplier.create({
                                data: {
                                    companyName: ident,
                                    email: ident.includes('@') ? ident : null
                                }
                            });
                            supplierId = newSup.id;
                        }
                    }
                    if (!supplierId) {
                        throw new Error("Se requiere un proveedor.");
                    }
                    const poLinesData = [];
                    let totalAmount = 0;
                    for (const line of lines) {
                        const variant = await tx.productVariant.findUnique({
                            where: { sku: line.sku }
                        });
                        if (!variant) {
                            throw new Error(`SKU no encontrado: ${line.sku}`);
                        }
                        const lineTotal = line.quantity * line.unitCost;
                        totalAmount += lineTotal;
                        poLinesData.push({
                            id: (0, uuid_1.v4)(),
                            variantId: variant.id,
                            orderedQuantity: line.quantity,
                            receivedQuantity: dto.updateStock ? line.quantity : 0,
                            unitCost: line.unitCost,
                            discountAmount: 0,
                            totalAmount: lineTotal
                        });
                        if (dto.updateStock) {
                            await tx.inventoryMovement.create({
                                data: {
                                    variantId: variant.id,
                                    destinationWarehouseId: dto.warehouseId,
                                    type: 'RECEIPT',
                                    quantity: line.quantity,
                                    unitCost: line.unitCost,
                                    referenceId: externalOrderId
                                }
                            });
                            const stockLevel = await tx.stockLevel.findFirst({
                                where: { variantId: variant.id, warehouseId: dto.warehouseId }
                            });
                            if (stockLevel) {
                                await tx.stockLevel.update({
                                    where: { id: stockLevel.id },
                                    data: {
                                        physicalQuantity: { increment: line.quantity },
                                        availableQuantity: { increment: line.quantity }
                                    }
                                });
                            }
                            else {
                                await tx.stockLevel.create({
                                    data: {
                                        variantId: variant.id,
                                        warehouseId: dto.warehouseId,
                                        physicalQuantity: line.quantity,
                                        availableQuantity: line.quantity
                                    }
                                });
                            }
                        }
                    }
                    const poId = (0, uuid_1.v4)();
                    await tx.purchaseOrder.create({
                        data: {
                            id: poId,
                            supplierId,
                            destinationWarehouseId: dto.warehouseId,
                            status: dto.updateStock ? 'COMPLETED' : 'ISSUED',
                            totalAmount,
                            paidAmount: 0,
                            currency: 'ARS',
                            issuedAt: firstLine.date ? new Date(firstLine.date) : new Date(),
                            completedAt: dto.updateStock ? (firstLine.date ? new Date(firstLine.date) : new Date()) : null,
                            lines: {
                                create: poLinesData
                            }
                        }
                    });
                    if (dto.updateStock) {
                        const grId = (0, uuid_1.v4)();
                        await tx.goodsReceipt.create({
                            data: {
                                id: grId,
                                purchaseOrderId: poId,
                                destinationWarehouseId: dto.warehouseId,
                                status: 'VALIDATED',
                                lines: {
                                    create: poLinesData.map(l => ({
                                        poLineItemId: l.id,
                                        variantId: l.variantId,
                                        expectedQuantity: l.orderedQuantity,
                                        receivedQuantity: l.receivedQuantity,
                                        difference: 0
                                    }))
                                }
                            }
                        });
                    }
                    let finalPaymentStatus = dto.paymentResolution;
                    if (finalPaymentStatus === 'FROM_CSV' && firstLine.paymentStatus) {
                        const ps = firstLine.paymentStatus.toUpperCase();
                        if (ps.includes('PAGAD') || ps.includes('EFECTIVO') || ps.includes('CASH')) {
                            finalPaymentStatus = 'PAID_CASH';
                        }
                        else {
                            finalPaymentStatus = 'CURRENT_ACCOUNT';
                        }
                    }
                    if (finalPaymentStatus === 'CURRENT_ACCOUNT') {
                        await tx.supplier.update({
                            where: { id: supplierId },
                            data: { balance: { increment: totalAmount } }
                        });
                    }
                    else if (finalPaymentStatus === 'PAID_CASH') {
                        await tx.purchaseOrder.update({
                            where: { id: poId },
                            data: { paidAmount: totalAmount }
                        });
                    }
                    createdCount++;
                }
                catch (error) {
                    errorCount++;
                    errors.push(`Orden ${externalOrderId}: ${error.message}`);
                }
            }
            return {
                success: true,
                createdCount,
                errorCount,
                errors
            };
        }, { timeout: 30000 });
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
    async generateReplenishmentOrders() {
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const inventoryConfig = (settings?.inventory) || {};
        const reorderPoint = parseInt(inventoryConfig.defaultReorderPoint) || 10;
        const reorderQuantity = parseInt(inventoryConfig.defaultReorderQuantity) || 50;
        const stockToReplenish = await this.prisma.stockLevel.findMany({
            where: {
                availableQuantity: { lte: reorderPoint }
            },
            include: {
                variant: {
                    include: { product: true }
                }
            }
        });
        if (stockToReplenish.length === 0) {
            return { success: true, message: 'No hay productos por debajo del punto de reposición.', ordersCreated: 0 };
        }
        const draftOrders = {};
        for (const stock of stockToReplenish) {
            const neededQty = reorderQuantity - stock.availableQuantity;
            if (neededQty <= 0)
                continue;
            const supplierId = 'UNKNOWN_SUPPLIER';
            const warehouseId = stock.warehouseId;
            if (!draftOrders[supplierId])
                draftOrders[supplierId] = {};
            if (!draftOrders[supplierId][warehouseId])
                draftOrders[supplierId][warehouseId] = [];
            draftOrders[supplierId][warehouseId].push({
                variantId: stock.variantId,
                orderedQuantity: neededQty,
                unitCost: stock.variant.costPrice || 0,
                totalAmount: neededQty * (stock.variant.costPrice || 0)
            });
        }
        let ordersCreated = 0;
        await this.prisma.$transaction(async (tx) => {
            let defaultSupplierId = null;
            if (draftOrders['UNKNOWN_SUPPLIER']) {
                let dummy = await tx.supplier.findFirst({ where: { companyName: 'Proveedores Varios' } });
                if (!dummy) {
                    dummy = await tx.supplier.create({ data: { companyName: 'Proveedores Varios' } });
                }
                defaultSupplierId = dummy.id;
            }
            for (const [supplierIdKey, warehouseGroups] of Object.entries(draftOrders)) {
                const actualSupplierId = supplierIdKey === 'UNKNOWN_SUPPLIER' ? defaultSupplierId : supplierIdKey;
                for (const [warehouseId, lines] of Object.entries(warehouseGroups)) {
                    const totalAmount = lines.reduce((sum, l) => sum + l.totalAmount, 0);
                    await tx.purchaseOrder.create({
                        data: {
                            supplierId: actualSupplierId,
                            destinationWarehouseId: warehouseId,
                            status: 'DRAFT',
                            totalAmount,
                            notes: 'Generada automáticamente por regla de reaprovisionamiento.',
                            lines: {
                                create: lines.map(l => ({
                                    variantId: l.variantId,
                                    orderedQuantity: l.orderedQuantity,
                                    unitCost: l.unitCost,
                                    totalAmount: l.totalAmount
                                }))
                            }
                        }
                    });
                    ordersCreated++;
                }
            }
        });
        return {
            success: true,
            message: `Se han generado ${ordersCreated} órdenes de compra en borrador.`,
            ordersCreated
        };
    }
};
exports.PurchasingService = PurchasingService;
exports.PurchasingService = PurchasingService = PurchasingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        stock_movement_service_1.StockMovementService])
], PurchasingService);
//# sourceMappingURL=purchasing.service.js.map