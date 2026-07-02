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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const sales_report_service_1 = require("./sales-report.service");
const stock_report_service_1 = require("./stock-report.service");
const dashboard_service_1 = require("./dashboard.service");
const cash_report_service_1 = require("./cash-report.service");
const purchases_report_service_1 = require("./purchases-report.service");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let ReportsController = class ReportsController {
    constructor(salesReport, stockReport, dashboardService, cashReport, purchasesReport) {
        this.salesReport = salesReport;
        this.stockReport = stockReport;
        this.dashboardService = dashboardService;
        this.cashReport = cashReport;
        this.purchasesReport = purchasesReport;
    }
    parseDate(val, fallback) {
        if (!val)
            return fallback;
        const d = new Date(val);
        return isNaN(d.getTime()) ? fallback : d;
    }
    getDefaultFrom() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(1);
        return d;
    }
    getDashboard(branchId) {
        return this.dashboardService.getDashboard(branchId);
    }
    getSalesSummary(from, to, branchId) {
        return this.salesReport.getSalesSummary({
            from: this.parseDate(from, this.getDefaultFrom()),
            to: this.parseDate(to, new Date()),
            branchId
        });
    }
    getTopSellers(from, to) {
        return this.salesReport.getTopSellers({
            from: this.parseDate(from, this.getDefaultFrom()),
            to: this.parseDate(to, new Date())
        });
    }
    getCogsReport(from, to) {
        return this.salesReport.getCogsReport({
            from: this.parseDate(from, this.getDefaultFrom()),
            to: this.parseDate(to, new Date())
        });
    }
    getStockValuation(branchId) {
        return this.stockReport.getStockValuation(branchId);
    }
    getLowStockAlerts(branchId, reorderPoint) {
        return this.stockReport.getLowStockAlerts(branchId, reorderPoint ? parseInt(reorderPoint) : undefined);
    }
    getPurchasesSummary(from, to, branchId) {
        return this.purchasesReport.getPurchasesSummary({
            from: this.parseDate(from, this.getDefaultFrom()),
            to: this.parseDate(to, new Date())
        });
    }
    getCashSummary(from, to, branchId) {
        return this.cashReport.getCashSummary({
            from: this.parseDate(from, this.getDefaultFrom()),
            to: this.parseDate(to, new Date()),
            branchId
        });
    }
    exportReport(body) {
        return { downloadUrl: `data:text/csv;charset=utf-8,Col1,Col2\nVal1,Val2` };
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('sales/summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getSalesSummary", null);
__decorate([
    (0, common_1.Get)('sales/top-sellers'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getTopSellers", null);
__decorate([
    (0, common_1.Get)('sales/cogs'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getCogsReport", null);
__decorate([
    (0, common_1.Get)('stock/valuation'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getStockValuation", null);
__decorate([
    (0, common_1.Get)('stock/low-stock'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('branchId')),
    __param(1, (0, common_1.Query)('reorderPoint')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getLowStockAlerts", null);
__decorate([
    (0, common_1.Get)('purchases/summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getPurchasesSummary", null);
__decorate([
    (0, common_1.Get)('cash/summary'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __param(2, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getCashSummary", null);
__decorate([
    (0, common_1.Post)('export/:type'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Reports' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "exportReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [sales_report_service_1.SalesReportService,
        stock_report_service_1.StockReportService,
        dashboard_service_1.DashboardService,
        cash_report_service_1.CashReportService,
        purchases_report_service_1.PurchasesReportService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map