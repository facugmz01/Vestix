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
exports.StorefrontController = void 0;
const common_1 = require("@nestjs/common");
const checkout_orchestrator_1 = require("./checkout.orchestrator");
const sales_service_1 = require("./sales.service");
let StorefrontController = class StorefrontController {
    constructor(checkoutOrchestrator, salesService) {
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.salesService = salesService;
    }
    async checkout(dto) {
        const saleOrderDto = {
            id: crypto.randomUUID(),
            branchId: 'main',
            warehouseId: null,
            source: 'ECOMMERCE',
            customerId: null,
            paymentMethod: dto.paymentMethod || 'MERCADOPAGO',
            paymentAccountId: null,
            status: 'PENDING_PAYMENT',
            lines: dto.cartLines.map((l) => ({
                variantId: l.variantId,
                quantity: l.quantity,
                price: l.price
            }))
        };
        return {
            status: 'SUCCESS',
            order: { id: saleOrderDto.id, status: 'PENDING_PAYMENT' }
        };
    }
    async getMyOrders(page, pageSize) {
        return { data: [], total: 0, page: parseInt(page) || 1, pageSize: parseInt(pageSize) || 15 };
    }
    async getMyOrder(id) {
        return this.salesService.getOrderById(id);
    }
};
exports.StorefrontController = StorefrontController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('my-orders'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('my-orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StorefrontController.prototype, "getMyOrder", null);
exports.StorefrontController = StorefrontController = __decorate([
    (0, common_1.Controller)('storefront'),
    __metadata("design:paramtypes", [checkout_orchestrator_1.CheckoutOrchestrator,
        sales_service_1.SalesService])
], StorefrontController);
//# sourceMappingURL=storefront.controller.js.map