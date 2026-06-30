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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const sales_report_service_1 = require("./sales-report.service");
const stock_report_service_1 = require("./stock-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(salesReport, stockReport, prisma) {
        this.salesReport = salesReport;
        this.stockReport = stockReport;
        this.prisma = prisma;
    }
    async getDashboard(branchId) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [todaySales, monthSales, topSellers, lowStockAlerts, monthCogs, pendingOrders] = await Promise.all([
            this.salesReport.getSalesSummary({ from: todayStart, to: now, branchId }),
            this.salesReport.getSalesSummary({ from: monthStart, to: now, branchId }),
            this.salesReport.getTopSellers({ from: monthStart, to: now, branchId }, 5),
            this.stockReport.getLowStockAlerts(branchId),
            this.salesReport.getCogsReport({ from: monthStart, to: now, branchId }),
            this.prisma.saleOrder.count({
                where: {
                    status: { in: ['PENDING', 'PROCESSING', 'PAID'] }
                }
            })
        ]);
        return {
            generatedAt: now,
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
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_report_service_1.SalesReportService,
        stock_report_service_1.StockReportService,
        prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map