"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const dashboard_service_1 = require("./dashboard.service");
const sales_report_service_1 = require("./sales-report.service");
const stock_report_service_1 = require("./stock-report.service");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const salesSummary = {
    totalOrders: 5,
    netRevenue: 10000,
    averageOrderValue: 2000,
    byPaymentMethod: [{ method: 'CASH', count: 5, amount: 10000 }],
};
const cogsSummary = { grossMarginPct: 35 };
const mockSalesReport = {
    getSalesSummary: globals_1.jest.fn().mockReturnValue(salesSummary),
    getTopSellers: globals_1.jest.fn().mockReturnValue([]),
    getCogsReport: globals_1.jest.fn().mockReturnValue(cogsSummary),
};
const mockStockReport = {
    getLowStockAlerts: globals_1.jest.fn().mockReturnValue([]),
};
const mockPrismaService = {
    saleOrder: { count: globals_1.jest.fn().mockReturnValue(3) },
};
(0, globals_1.describe)('DashboardService', () => {
    let service;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                dashboard_service_1.DashboardService,
                { provide: sales_report_service_1.SalesReportService, useValue: mockSalesReport },
                { provide: stock_report_service_1.StockReportService, useValue: mockStockReport },
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(dashboard_service_1.DashboardService);
        globals_1.jest.clearAllMocks();
        mockSalesReport.getSalesSummary.mockReturnValue(salesSummary);
        mockSalesReport.getTopSellers.mockReturnValue([]);
        mockSalesReport.getCogsReport.mockReturnValue(cogsSummary);
        mockStockReport.getLowStockAlerts.mockReturnValue([]);
        mockPrismaService.saleOrder.count.mockReturnValue(3);
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(service).toBeDefined();
    });
    (0, globals_1.describe)('getDashboard', () => {
        (0, globals_1.it)('should return a complete dashboard summary', async () => {
            const result = await service.getDashboard();
            (0, globals_1.expect)(result.generatedAt).toBeInstanceOf(Date);
            (0, globals_1.expect)(result.today.revenue).toBe(10000);
            (0, globals_1.expect)(result.today.orders).toBe(5);
            (0, globals_1.expect)(result.today.avgOrderValue).toBe(2000);
            (0, globals_1.expect)(result.today.cashInDrawers).toBe(10000);
            (0, globals_1.expect)(result.thisMonth.revenue).toBe(10000);
            (0, globals_1.expect)(result.thisMonth.grossMarginPct).toBe(35);
            (0, globals_1.expect)(result.pendingOrders).toBe(3);
        });
        (0, globals_1.it)('should pass branchId to sub-reports', async () => {
            await service.getDashboard('b1');
            (0, globals_1.expect)(mockSalesReport.getSalesSummary).toHaveBeenCalledWith(globals_1.expect.objectContaining({ branchId: 'b1' }));
            (0, globals_1.expect)(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1');
        });
        (0, globals_1.it)('should return 0 cashInDrawers when no CASH payment method', async () => {
            mockSalesReport.getSalesSummary.mockReturnValue({
                ...salesSummary,
                byPaymentMethod: [{ method: 'CARD', count: 5, amount: 10000 }],
            });
            const result = await service.getDashboard();
            (0, globals_1.expect)(result.today.cashInDrawers).toBe(0);
        });
    });
});
//# sourceMappingURL=dashboard.service.spec.js.map