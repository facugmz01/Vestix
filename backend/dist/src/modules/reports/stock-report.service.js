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
        const branchFilter = branchId ? { warehouse: { branchId } } : {};
        const stockLevels = await this.prisma.stockLevel.findMany({
            where: { ...branchFilter },
            include: {
                variant: {
                    include: { product: true }
                }
            }
        });
        const lines = stockLevels.map(sl => {
            const unitCostWac = sl.variant?.costPrice || 0;
            const unitRetailPrice = sl.variant?.basePrice || 0;
            return {
                variantId: sl.variantId,
                sku: sl.variant?.sku || 'Unknown',
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
    async getLowStockAlerts(branchId, reorderPoint = DEFAULT_REORDER_POINT) {
        const branchFilter = branchId ? { warehouse: { branchId } } : {};
        const stockLevels = await this.prisma.stockLevel.findMany({
            where: {
                availableQuantity: { lte: reorderPoint },
                ...branchFilter
            },
            include: {
                variant: {
                    include: { product: true }
                },
                warehouse: true
            }
        });
        return stockLevels.map(sl => ({
            variantId: sl.variantId,
            sku: sl.variant?.sku || 'Unknown',
            name: sl.variant?.product?.name || 'Unknown',
            branchId: sl.warehouse?.branchId || branchId || 'Unknown',
            availableQuantity: sl.availableQuantity,
            reorderPoint: reorderPoint
        }));
    }
};
exports.StockReportService = StockReportService;
exports.StockReportService = StockReportService = StockReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StockReportService);
//# sourceMappingURL=stock-report.service.js.map