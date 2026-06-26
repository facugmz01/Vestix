"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SalesReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesReportService = void 0;
const common_1 = require("@nestjs/common");
let SalesReportService = SalesReportService_1 = class SalesReportService {
    constructor() {
        this.logger = new common_1.Logger(SalesReportService_1.name);
    }
    async getSalesSummary(filter) {
        this.logger.log(`[SalesReport] Summary requested: ${filter.from.toISOString()} → ${filter.to.toISOString()}`);
        return {
            period: { from: filter.from, to: filter.to },
            totalOrders: 340,
            totalRevenue: 128000,
            totalDiscounts: 9500,
            netRevenue: 118500,
            averageOrderValue: 376.47,
            byPaymentMethod: [
                { method: 'CASH', count: 120, amount: 52000 },
                { method: 'CREDIT_CARD', count: 90, amount: 47000 },
                { method: 'CUSTOMER_CREDIT', count: 35, amount: 19500 },
            ],
            byChannel: {
                POS: 89000,
                ECOMMERCE: 39000,
            },
        };
    }
    async getTopSellers(filter, limit = 10) {
        return [
            { variantId: 'v1', name: 'Premium T-Shirt / M / Black', sku: 'TSH-PRM-M-BLK', totalUnitsSold: 87, totalRevenue: 1740 },
            { variantId: 'v2', name: 'Winter Jacket / L / Navy', sku: 'JKT-WIN-L-NVY', totalUnitsSold: 34, totalRevenue: 4080 },
            { variantId: 'v3', name: 'Skinny Jeans / 32 / Blue', sku: 'JNS-SKN-32-BLU', totalUnitsSold: 61, totalRevenue: 3050 },
        ].slice(0, limit);
    }
    async getCogsReport(filter) {
        const totalCOGS = 74000;
        const totalRevenue = 118500;
        const grossProfit = totalRevenue - totalCOGS;
        return {
            period: { from: filter.from, to: filter.to },
            totalCOGS,
            totalRevenue,
            grossProfit,
            grossMarginPct: parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)),
        };
    }
};
exports.SalesReportService = SalesReportService;
exports.SalesReportService = SalesReportService = SalesReportService_1 = __decorate([
    (0, common_1.Injectable)()
], SalesReportService);
//# sourceMappingURL=sales-report.service.js.map