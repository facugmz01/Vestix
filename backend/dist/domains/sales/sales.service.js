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
const prisma_service_1 = require("../../core/prisma/prisma.service");
const uuid_1 = require("uuid");
const catalog_facade_1 = require("../catalog/catalog.facade");
const sale_order_repository_1 = require("./repositories/sale-order.repository");
let SalesService = class SalesService {
    constructor(prisma, repository, catalogFacade) {
        this.prisma = prisma;
        this.repository = repository;
        this.catalogFacade = catalogFacade;
    }
    async getOrderById(id) {
        const cleanId = id.replace(/^[VP]-/i, '');
        const order = await this.repository.findById(id);
        if (order) {
            const variantIds = order.lines.map(l => l.variantId);
            const variants = await this.catalogFacade.getVariantsDetails(variantIds);
            const variantMap = new Map(variants.map(v => [v.id, v]));
            order.lines = order.lines.map(l => ({
                ...l,
                variant: variantMap.get(l.variantId)
            }));
        }
        return order;
    }
    async listRecentOrders(branchId) {
        return this.repository.findRecentByBranch(branchId);
    }
    async getOrders(params) {
        const page = parseInt(params.page) || 1;
        const pageSize = parseInt(params.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const { search, status } = params;
        const where = {};
        if (status)
            where.status = status;
        if (search && search.trim() !== '') {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { customer: { fullName: { contains: search, mode: 'insensitive' } } }
            ];
        }
        const { data, total } = await this.repository.findPaginated(where, skip, pageSize);
        return {
            data: data.map(order => ({
                ...order,
                customerName: order.customer?.fullName || 'Consumidor Final'
            })),
            total
        };
    }
    async updateOrderStatus(id, status) {
        return this.repository.updateStatus(id, status);
    }
    async bulkImportSales(dto) {
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
                    let customerId = null;
                    if (firstLine.customerIdentifier) {
                        const ident = firstLine.customerIdentifier.trim();
                        const customer = await tx.customer.findFirst({
                            where: {
                                OR: [
                                    { email: { equals: ident, mode: 'insensitive' } },
                                    { taxId: ident },
                                    { fullName: { equals: ident, mode: 'insensitive' } }
                                ]
                            }
                        });
                        if (customer) {
                            customerId = customer.id;
                        }
                        else {
                            const newCust = await tx.customer.create({
                                data: {
                                    type: 'INDIVIDUAL',
                                    fullName: ident,
                                    email: ident.includes('@') ? ident : null,
                                    isActive: true
                                }
                            });
                            customerId = newCust.id;
                        }
                    }
                    const orderLinesData = [];
                    let subtotal = 0;
                    for (const line of lines) {
                        const variant = await tx.productVariant.findUnique({
                            where: { sku: line.sku },
                            include: { product: true }
                        });
                        if (!variant) {
                            throw new Error(`SKU no encontrado: ${line.sku}`);
                        }
                        const lineTotal = line.quantity * line.unitPrice;
                        subtotal += lineTotal;
                        orderLinesData.push({
                            id: (0, uuid_1.v4)(),
                            variantId: variant.id,
                            categoryId: variant.product.categoryId,
                            quantity: line.quantity,
                            basePrice: line.unitPrice,
                            discountAmount: 0,
                            finalPrice: lineTotal,
                            historicalSku: variant.sku,
                            historicalName: variant.product.name,
                            historicalCost: variant.costPrice
                        });
                        if (dto.updateStock) {
                            const wh = await tx.warehouse.findFirst({ where: { branchId: dto.branchId } });
                            if (wh) {
                                await tx.inventoryMovement.create({
                                    data: {
                                        variantId: variant.id,
                                        sourceWarehouseId: wh.id,
                                        type: 'SALE',
                                        quantity: -line.quantity,
                                        unitCost: variant.costPrice,
                                        referenceId: externalOrderId
                                    }
                                });
                                const stockLevel = await tx.stockLevel.findFirst({
                                    where: { variantId: variant.id, warehouseId: wh.id }
                                });
                                if (stockLevel) {
                                    await tx.stockLevel.update({
                                        where: { id: stockLevel.id },
                                        data: {
                                            physicalQuantity: { decrement: line.quantity },
                                            availableQuantity: { decrement: line.quantity }
                                        }
                                    });
                                }
                            }
                        }
                    }
                    const orderId = (0, uuid_1.v4)();
                    await tx.saleOrder.create({
                        data: {
                            id: orderId,
                            branchId: dto.branchId,
                            source: 'IMPORT',
                            customerId,
                            subtotal,
                            cartDiscountTotal: 0,
                            grandTotal: subtotal,
                            paymentMethod: dto.paymentResolution === 'PAID_CASH' ? 'CASH' : 'CUSTOMER_CREDIT',
                            status: 'COMPLETED',
                            createdAt: firstLine.date ? new Date(firstLine.date) : new Date(),
                            lines: {
                                create: orderLinesData
                            }
                        }
                    });
                    await tx.outboxEvent.create({
                        data: {
                            aggregate: 'SaleOrder',
                            aggregateId: orderId,
                            type: 'ORDER_CREATED',
                            payload: { orderId: orderId, branchId: dto.branchId, status: 'COMPLETED', grandTotal: subtotal }
                        }
                    });
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
                    if (finalPaymentStatus === 'CURRENT_ACCOUNT' && customerId) {
                        await tx.customer.update({
                            where: { id: customerId },
                            data: { usedCredit: { increment: subtotal } }
                        });
                    }
                    else if (finalPaymentStatus === 'PAID_CASH') {
                        const pm = await tx.paymentMethod.findFirst({ where: { type: 'CASH' } });
                        if (pm) {
                            await tx.saleOrderPayment.create({
                                data: {
                                    orderId,
                                    paymentMethodId: pm.id,
                                    amount: subtotal
                                }
                            });
                        }
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
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sale_order_repository_1.SaleOrderRepository,
        catalog_facade_1.CatalogFacade])
], SalesService);
//# sourceMappingURL=sales.service.js.map