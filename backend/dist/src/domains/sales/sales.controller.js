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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const sales_service_1 = require("./sales.service");
const checkout_orchestrator_1 = require("./checkout.orchestrator");
const create_order_dto_1 = require("./dto/create-order.dto");
const bulk_sales_dto_1 = require("./dto/bulk-sales.dto");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let SalesController = class SalesController {
    constructor(salesService, checkoutOrchestrator) {
        this.salesService = salesService;
        this.checkoutOrchestrator = checkoutOrchestrator;
    }
    async checkout(createOrderDto, req) {
        return this.checkoutOrchestrator.processCheckout(createOrderDto, req.user?.userId);
    }
    async getReturns() {
        return { data: [], total: 0 };
    }
    async bulkImportSales(dto) {
        return this.salesService.bulkImportSales(dto);
    }
    async getOrders(query) {
        return this.salesService.getOrders(query);
    }
    async getOrder(id) {
        return this.salesService.getOrderById(id);
    }
    async confirmOrder(id) {
        return this.checkoutOrchestrator.confirmQuotation(id);
    }
    async cancelOrder(id) {
        return this.checkoutOrchestrator.cancelOrder(id);
    }
    async sendManualReceipt(id, body) {
        return { success: true, message: 'Comprobante de venta enviado a la cola de notificaciones' };
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Post)('checkout'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('returns'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getReturns", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_sales_dto_1.BulkImportSalesDto]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "bulkImportSales", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/confirm'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Sales' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "confirmOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Sales' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/send-receipt'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "sendManualReceipt", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    __metadata("design:paramtypes", [sales_service_1.SalesService,
        checkout_orchestrator_1.CheckoutOrchestrator])
], SalesController);
//# sourceMappingURL=sales.controller.js.map