"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const testing_1 = require("@nestjs/testing");
const reports_controller_1 = require("./reports.controller");
const sales_report_service_1 = require("./sales-report.service");
const stock_report_service_1 = require("./stock-report.service");
const dashboard_service_1 = require("./dashboard.service");
const cash_report_service_1 = require("./cash-report.service");
const purchases_report_service_1 = require("./purchases-report.service");
const mockSalesReport = {
    getSalesSummary: globals_1.jest.fn(),
    getTopSellers: globals_1.jest.fn(),
    getCogsReport: globals_1.jest.fn(),
};
const mockStockReport = {
    getStockValuation: globals_1.jest.fn(),
    getLowStockAlerts: globals_1.jest.fn(),
};
const mockDashboard = {
    getDashboard: globals_1.jest.fn(),
};
const mockCashReport = {
    getCashSummary: globals_1.jest.fn(),
};
const mockPurchasesReport = {
    getPurchasesSummary: globals_1.jest.fn(),
};
(0, globals_1.describe)('ReportsController', () => {
    let controller;
    (0, globals_1.beforeEach)(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [reports_controller_1.ReportsController],
            providers: [
                { provide: sales_report_service_1.SalesReportService, useValue: mockSalesReport },
                { provide: stock_report_service_1.StockReportService, useValue: mockStockReport },
                { provide: dashboard_service_1.DashboardService, useValue: mockDashboard },
                { provide: cash_report_service_1.CashReportService, useValue: mockCashReport },
                { provide: purchases_report_service_1.PurchasesReportService, useValue: mockPurchasesReport },
            ],
        }).compile();
        controller = module.get(reports_controller_1.ReportsController);
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should be defined', () => {
        (0, globals_1.expect)(controller).toBeDefined();
    });
    (0, globals_1.describe)('getDashboard', () => {
        (0, globals_1.it)('should delegate to dashboardService', () => {
            const expected = { today: { revenue: 1000 } };
            mockDashboard.getDashboard.mockReturnValue(expected);
            (0, globals_1.expect)(controller.getDashboard('b1')).toEqual(expected);
            (0, globals_1.expect)(mockDashboard.getDashboard).toHaveBeenCalledWith('b1');
        });
    });
    (0, globals_1.describe)('getSalesSummary', () => {
        (0, globals_1.it)('should pass parsed dates to salesReport', () => {
            mockSalesReport.getSalesSummary.mockReturnValue({ totalOrders: 5 });
            controller.getSalesSummary('2026-01-01', '2026-01-31', 'b1');
            const call = mockSalesReport.getSalesSummary.mock.calls[0][0];
            (0, globals_1.expect)(call.from).toEqual(new Date('2026-01-01'));
            (0, globals_1.expect)(call.to).toEqual(new Date('2026-01-31'));
            (0, globals_1.expect)(call.branchId).toBe('b1');
        });
    });
    (0, globals_1.describe)('getTopSellers', () => {
        (0, globals_1.it)('should delegate to salesReport.getTopSellers', () => {
            mockSalesReport.getTopSellers.mockReturnValue([]);
            controller.getTopSellers('2026-01-01', '2026-01-31');
            const call = mockSalesReport.getTopSellers.mock.calls[0][0];
            (0, globals_1.expect)(call.from).toEqual(new Date('2026-01-01'));
        });
    });
    (0, globals_1.describe)('getCogsReport', () => {
        (0, globals_1.it)('should delegate to salesReport.getCogsReport', () => {
            mockSalesReport.getCogsReport.mockReturnValue({ totalCOGS: 500 });
            controller.getCogsReport('2026-01-01', '2026-01-31');
            (0, globals_1.expect)(mockSalesReport.getCogsReport).toHaveBeenCalled();
        });
    });
    (0, globals_1.describe)('getStockValuation', () => {
        (0, globals_1.it)('should delegate to stockReport.getStockValuation', () => {
            mockStockReport.getStockValuation.mockReturnValue({ totalSKUs: 100 });
            (0, globals_1.expect)(controller.getStockValuation('b1')).toEqual({ totalSKUs: 100 });
            (0, globals_1.expect)(mockStockReport.getStockValuation).toHaveBeenCalledWith('b1');
        });
    });
    (0, globals_1.describe)('getLowStockAlerts', () => {
        (0, globals_1.it)('should parse reorderPoint as integer', () => {
            mockStockReport.getLowStockAlerts.mockReturnValue([]);
            controller.getLowStockAlerts('b1', '10');
            (0, globals_1.expect)(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1', 10);
        });
        (0, globals_1.it)('should pass undefined when reorderPoint is not provided', () => {
            mockStockReport.getLowStockAlerts.mockReturnValue([]);
            controller.getLowStockAlerts('b1');
            (0, globals_1.expect)(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1', undefined);
        });
    });
    (0, globals_1.describe)('getPurchasesSummary', () => {
        (0, globals_1.it)('should delegate to purchasesReport', () => {
            mockPurchasesReport.getPurchasesSummary.mockReturnValue({ totalOrders: 3 });
            controller.getPurchasesSummary('2026-01-01', '2026-01-31', 'b1');
            const call = mockPurchasesReport.getPurchasesSummary.mock.calls[0][0];
            (0, globals_1.expect)(call.from).toEqual(new Date('2026-01-01'));
            (0, globals_1.expect)(call.to).toEqual(new Date('2026-01-31'));
        });
    });
    (0, globals_1.describe)('getCashSummary', () => {
        (0, globals_1.it)('should delegate to cashReport with parsed dates and branchId', () => {
            mockCashReport.getCashSummary.mockReturnValue({ netCash: 500 });
            controller.getCashSummary('2026-01-01', '2026-01-31', 'b1');
            const call = mockCashReport.getCashSummary.mock.calls[0][0];
            (0, globals_1.expect)(call.from).toEqual(new Date('2026-01-01'));
            (0, globals_1.expect)(call.branchId).toBe('b1');
        });
    });
    (0, globals_1.describe)('exportReport', () => {
        (0, globals_1.it)('should return a downloadUrl', () => {
            const result = controller.exportReport({});
            (0, globals_1.expect)(result.downloadUrl).toContain('data:text/csv');
        });
    });
});
//# sourceMappingURL=reports.controller.spec.js.map