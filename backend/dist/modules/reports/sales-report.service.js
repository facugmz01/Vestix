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
var SalesReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let SalesReportService = SalesReportService_1 = class SalesReportService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SalesReportService_1.name);
    }
    async getSalesSummary(filter) {
        this.logger.log(`[SalesReport] Summary requested: ${filter.from.toISOString()} -> ${filter.to.toISOString()}`);
        const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};
        const orders = await this.prisma.saleOrder.findMany({
            where: {
                createdAt: { gte: filter.from, lte: filter.to },
                status: { not: 'CANCELLED' },
                ...branchFilter,
            },
            include: {
                payments: {
                    include: { paymentMethod: true }
                }
            }
        });
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalDiscounts = 0;
        let netRevenue = 0;
        const methodMap = new Map();
        const channelMap = new Map();
        for (const order of orders) {
            totalOrders++;
            totalRevenue += order.subtotal;
            totalDiscounts += order.cartDiscountTotal;
            netRevenue += order.grandTotal;
            const source = order.source || 'POS';
            channelMap.set(source, (channelMap.get(source) || 0) + order.grandTotal);
            if (order.payments && order.payments.length > 0) {
                for (const payment of order.payments) {
                    const methodType = payment.paymentMethod?.type || 'UNKNOWN';
                    const current = methodMap.get(methodType) || { count: 0, amount: 0 };
                    current.count++;
                    current.amount += payment.amount;
                    methodMap.set(methodType, current);
                }
            }
            else {
                const methodType = order.paymentMethod || 'UNKNOWN';
                const current = methodMap.get(methodType) || { count: 0, amount: 0 };
                current.count++;
                current.amount += order.grandTotal;
                methodMap.set(methodType, current);
            }
        }
        const byPaymentMethod = Array.from(methodMap.entries()).map(([method, data]) => ({
            method,
            count: data.count,
            amount: data.amount
        }));
        const byChannel = Object.fromEntries(channelMap);
        return {
            period: { from: filter.from, to: filter.to },
            totalOrders,
            totalRevenue,
            totalDiscounts,
            netRevenue,
            averageOrderValue: totalOrders > 0 ? netRevenue / totalOrders : 0,
            byPaymentMethod,
            byChannel,
        };
    }
    async getTopSellers(filter, limit = 10) {
        const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};
        const lineItems = await this.prisma.orderLineItem.findMany({
            where: {
                order: {
                    createdAt: { gte: filter.from, lte: filter.to },
                    status: { not: 'CANCELLED' },
                    ...branchFilter,
                }
            }
        });
        const variantIds = [...new Set(lineItems.map(l => l.variantId))];
        const variants = await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: true }
        });
        const variantMap = new Map(variants.map(v => [v.id, v]));
        const reportMap = new Map();
        for (const item of lineItems) {
            if (!reportMap.has(item.variantId)) {
                const v = variantMap.get(item.variantId);
                reportMap.set(item.variantId, {
                    variantId: item.variantId,
                    name: v?.product?.name || item.historicalName || 'Unknown',
                    sku: v?.sku || item.historicalSku || 'Unknown',
                    totalUnitsSold: 0,
                    totalRevenue: 0,
                });
            }
            const v = reportMap.get(item.variantId);
            v.totalUnitsSold += item.quantity;
            v.totalRevenue += item.finalPrice;
        }
        return Array.from(reportMap.values())
            .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold)
            .slice(0, limit);
    }
    async getCogsReport(filter) {
        const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};
        let warehouseFilter = {};
        if (filter.branchId) {
            const warehouses = await this.prisma.warehouse.findMany({
                where: { branchId: filter.branchId },
                select: { id: true }
            });
            warehouseFilter = {
                sourceWarehouseId: { in: warehouses.map(w => w.id) }
            };
        }
        const movements = await this.prisma.inventoryMovement.findMany({
            where: {
                type: 'SALE',
                createdAt: { gte: filter.from, lte: filter.to },
                ...warehouseFilter,
            }
        });
        let totalCOGS = 0;
        for (const m of movements) {
            totalCOGS += (m.quantity * m.unitCost);
        }
        const salesSummary = await this.getSalesSummary(filter);
        const totalRevenue = salesSummary.netRevenue;
        const grossProfit = totalRevenue - totalCOGS;
        return {
            period: { from: filter.from, to: filter.to },
            totalCOGS,
            totalRevenue,
            grossProfit,
            grossMarginPct: totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
        };
    }
};
exports.SalesReportService = SalesReportService;
exports.SalesReportService = SalesReportService = SalesReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SalesReportService);
//# sourceMappingURL=sales-report.service.js.map