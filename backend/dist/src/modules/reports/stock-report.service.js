"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StockReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockReportService = void 0;
const common_1 = require("@nestjs/common");
const DEFAULT_REORDER_POINT = 5;
let StockReportService = StockReportService_1 = class StockReportService {
    constructor() {
        this.logger = new common_1.Logger(StockReportService_1.name);
    }
    async getStockValuation(branchId) {
        this.logger.log(`[StockReport] Valuation requested${branchId ? ` for branch ${branchId}` : ' (all branches)'}`);
        const mockLines = [
            { variantId: 'v1', sku: 'TSH-PRM-M-BLK', availableQty: 120, reservedQty: 5, unitCostWac: 9.50, unitRetailPrice: 20.00 },
            { variantId: 'v2', sku: 'JKT-WIN-L-NVY', availableQty: 42, reservedQty: 3, unitCostWac: 55.00, unitRetailPrice: 120.00 },
            { variantId: 'v3', sku: 'JNS-SKN-32-BLU', availableQty: 8, reservedQty: 0, unitCostWac: 22.00, unitRetailPrice: 50.00 },
        ];
        const lines = mockLines.map(l => ({
            ...l,
            totalCostValue: parseFloat((l.availableQty * l.unitCostWac).toFixed(2)),
            totalRetailValue: parseFloat((l.availableQty * l.unitRetailPrice).toFixed(2)),
        }));
        const totalCost = lines.reduce((s, l) => s + l.totalCostValue, 0);
        const totalRetail = lines.reduce((s, l) => s + l.totalRetailValue, 0);
        return {
            generatedAt: new Date(),
            branchId,
            totalSKUs: lines.length,
            totalUnits: lines.reduce((s, l) => s + l.availableQty, 0),
            totalValueAtCost: parseFloat(totalCost.toFixed(2)),
            totalValueAtRetail: parseFloat(totalRetail.toFixed(2)),
            potentialMargin: parseFloat((((totalRetail - totalCost) / totalRetail) * 100).toFixed(2)),
            lines,
        };
    }
    async getLowStockAlerts(branchId, reorderPoint = DEFAULT_REORDER_POINT) {
        const mockAlerts = [
            { variantId: 'v3', sku: 'JNS-SKN-32-BLU', name: 'Skinny Jeans / 32 / Blue', branchId: branchId ?? 'branch-1', availableQuantity: 8, reorderPoint: 10 },
        ];
        return mockAlerts.filter(a => a.availableQuantity <= reorderPoint);
    }
};
exports.StockReportService = StockReportService;
exports.StockReportService = StockReportService = StockReportService_1 = __decorate([
    (0, common_1.Injectable)()
], StockReportService);
//# sourceMappingURL=stock-report.service.js.map