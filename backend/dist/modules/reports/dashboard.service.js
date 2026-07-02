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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const sales_report_service_1 = require("./sales-report.service");
const stock_report_service_1 = require("./stock-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let DashboardService = DashboardService_1 = class DashboardService {
    constructor(salesReport, stockReport, prisma) {
        this.salesReport = salesReport;
        this.stockReport = stockReport;
        this.prisma = prisma;
        this.logger = new common_1.Logger(DashboardService_1.name);
    }
    buildTodayRange() {
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        return { from, to: new Date() };
    }
    buildMonthRange() {
        const to = new Date();
        const from = new Date(to.getFullYear(), to.getMonth(), 1);
        return { from, to };
    }
    async getDashboard(branchId) {
        const t0 = Date.now();
        const today = this.buildTodayRange();
        const month = this.buildMonthRange();
        const [todaySales, monthSales, topSellers] = await Promise.all([
            this.salesReport.getSalesSummary({ from: today.from, to: today.to, branchId }),
            this.salesReport.getSalesSummary({ from: month.from, to: month.to, branchId }),
            this.salesReport.getTopSellers({ from: month.from, to: month.to, branchId }, 5),
        ]);
        const [lowStockAlerts, monthCogs, pendingOrders] = await Promise.all([
            this.stockReport.getLowStockAlerts(branchId),
            this.salesReport.getCogsReport({ from: month.from, to: month.to, branchId }, monthSales.netRevenue),
            this.prisma.saleOrder.count({
                where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
            }),
        ]);
        this.logger.log(`[Dashboard] Resolved in ${Date.now() - t0}ms${branchId ? ` (branch: ${branchId})` : ''}`);
        return {
            generatedAt: today.to,
            today: {
                revenue: todaySales.netRevenue,
                orders: todaySales.totalOrders,
                avgOrderValue: todaySales.averageOrderValue,
                cashInDrawers: todaySales.byPaymentMethod.find(m => m.method === 'CASH')?.amount ?? 0,
            },
            thisMonth: {
                revenue: monthSales.netRevenue,
                orders: monthSales.totalOrders,
                grossMarginPct: monthCogs.grossMarginPct,
            },
            topSellers,
            lowStockAlerts,
            pendingOrders,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_report_service_1.SalesReportService,
        stock_report_service_1.StockReportService,
        prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map