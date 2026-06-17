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
exports.PurchasingController = void 0;
const common_1 = require("@nestjs/common");
const purchasing_service_1 = require("./purchasing.service");
const create_po_dto_1 = require("./dto/create-po.dto");
const receive_goods_dto_1 = require("./dto/receive-goods.dto");
const jwt_auth_guard_1 = require("../../core/auth/jwt-auth.guard");
const roles_guard_1 = require("../../core/rbac/roles.guard");
const roles_decorator_1 = require("../../core/rbac/roles.decorator");
let PurchasingController = class PurchasingController {
    constructor(purchasingService) {
        this.purchasingService = purchasingService;
    }
    createPurchaseOrder(dto) {
        return this.purchasingService.createPurchaseOrder(dto);
    }
    receiveGoods(dto) {
        return this.purchasingService.receiveGoods(dto);
    }
    findAllOrders(query) {
        return this.purchasingService.findAllOrders(query);
    }
    findOneOrder(id) {
        return this.purchasingService.findOneOrder(id);
    }
    issueOrder(id) {
        return this.purchasingService.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'ISSUED' },
        });
    }
    receiveOrder(id, dto) {
        return this.purchasingService.receiveGoods({ ...dto, purchaseOrderId: id });
    }
    removeOrder(id) {
        return this.purchasingService.prisma.purchaseOrder.delete({
            where: { id },
        });
    }
    findAllReceipts(query) {
        return this.purchasingService.findAllReceipts(query);
    }
    findOneReceipt(id) {
        return this.purchasingService.findOneReceipt(id);
    }
};
exports.PurchasingController = PurchasingController;
__decorate([
    (0, common_1.Post)('orders'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_po_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Post)('receipts'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [receive_goods_dto_1.ReceiveGoodsDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "receiveGoods", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findAllOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findOneOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/issue'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "issueOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/receive'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, receive_goods_dto_1.ReceiveGoodsDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "receiveOrder", null);
__decorate([
    (0, common_1.Delete)('orders/:id'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "removeOrder", null);
__decorate([
    (0, common_1.Get)('receipts'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findAllReceipts", null);
__decorate([
    (0, common_1.Get)('receipts/:id'),
    (0, roles_decorator_1.Roles)('Store Manager', 'Backoffice Admin', 'Inventory Clerk'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findOneReceipt", null);
exports.PurchasingController = PurchasingController = __decorate([
    (0, common_1.Controller)('purchasing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [purchasing_service_1.PurchasingService])
], PurchasingController);
//# sourceMappingURL=purchasing.controller.js.map