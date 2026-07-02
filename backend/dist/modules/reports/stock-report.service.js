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
var StockReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const DEFAULT_REORDER_POINT = 5;
let StockReportService = StockReportService_1 = class StockReportService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(StockReportService_1.name);
    }
    async getStockValuation(branchId) {
        this.logger.log(`[StockReport] Valuation requested${branchId ? ` for branch ${branchId}` : ' (all branches)'}`);
        let branchFilter = {};
        if (branchId) {
            const warehouses = await this.prisma.warehouse.findMany({ where: { branchId } });
            branchFilter = { warehouseId: { in: warehouses.map(w => w.id) } };
        }
        const stockLevels = await this.prisma.stockLevel.findMany({
            where: { ...branchFilter }
        });
        const variantIds = [...new Set(stockLevels.map(sl => sl.variantId))];
        const chunkSize = 10000;
        const variants = [];
        for (let i = 0; i < variantIds.length; i += chunkSize) {
            const chunk = variantIds.slice(i, i + chunkSize);
            const chunkResult = await this.prisma.productVariant.findMany({
                where: { id: { in: chunk } },
                include: { product: true }
            });
            variants.push(...chunkResult);
        }
        const variantMap = new Map(variants.map(v => [v.id, v]));
        const lines = stockLevels.map(sl => {
            const v = variantMap.get(sl.variantId);
            const unitCostWac = v?.costPrice || 0;
            const unitRetailPrice = v?.basePrice || 0;
            return {
                variantId: sl.variantId,
                sku: v?.sku || 'Unknown',
                availableQty: sl.availableQuantity,
                reservedQty: sl.reservedQuantity,
                unitCostWac,
                unitRetailPrice,
                totalCostValue: parseFloat((sl.availableQuantity * unitCostWac).toFixed(2)),
                totalRetailValue: parseFloat((sl.availableQuantity * unitRetailPrice).toFixed(2)),
            };
        });
        const totalCost = lines.reduce((s, l) => s + l.totalCostValue, 0);
        const totalRetail = lines.reduce((s, l) => s + l.totalRetailValue, 0);
        return {
            generatedAt: new Date(),
            branchId,
            totalSKUs: lines.length,
            totalUnits: lines.reduce((s, l) => s + l.availableQty, 0),
            totalValueAtCost: parseFloat(totalCost.toFixed(2)),
            totalValueAtRetail: parseFloat(totalRetail.toFixed(2)),
            potentialMargin: totalRetail > 0 ? parseFloat((((totalRetail - totalCost) / totalRetail) * 100).toFixed(2)) : 0,
            lines,
        };
    }
    async getLowStockAlerts(branchId, reorderPoint = DEFAULT_REORDER_POINT, limit = 50) {
        let branchFilter = {};
        if (branchId) {
            const warehouses = await this.prisma.warehouse.findMany({ where: { branchId } });
            branchFilter = { warehouseId: { in: warehouses.map(w => w.id) } };
        }
        const stockLevels = await this.prisma.stockLevel.findMany({
            where: {
                availableQuantity: { lte: reorderPoint },
                ...branchFilter
            },
            orderBy: {
                availableQuantity: 'asc'
            },
            take: limit
        });
        const variantIds = [...new Set(stockLevels.map(sl => sl.variantId))];
        const chunkSize = 10000;
        const variants = [];
        for (let i = 0; i < variantIds.length; i += chunkSize) {
            const chunk = variantIds.slice(i, i + chunkSize);
            const chunkResult = await this.prisma.productVariant.findMany({
                where: { id: { in: chunk } },
                include: { product: true }
            });
            variants.push(...chunkResult);
        }
        const variantMap = new Map(variants.map(v => [v.id, v]));
        return stockLevels.map(sl => {
            const v = variantMap.get(sl.variantId);
            return {
                variantId: sl.variantId,
                sku: v?.sku || 'Unknown',
                name: v?.product?.name || 'Unknown',
                branchId: sl.branchId || branchId || 'Unknown',
                availableQuantity: sl.availableQuantity,
                reorderPoint: reorderPoint
            };
        });
    }
};
exports.StockReportService = StockReportService;
exports.StockReportService = StockReportService = StockReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockReportService);
//# sourceMappingURL=stock-report.service.js.map