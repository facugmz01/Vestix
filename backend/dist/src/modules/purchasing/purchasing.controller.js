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
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let PurchasingController = class PurchasingController {
    constructor(purchasingService) {
        this.purchasingService = purchasingService;
    }
    findAll(query) {
        return this.purchasingService.findAll(query);
    }
    processDirectPurchase(dto) {
        return this.purchasingService.processDirectPurchase(dto);
    }
    createPO(dto) {
        return this.purchasingService.createPO(dto);
    }
    findOne(id) {
        return this.purchasingService.getPO(id);
    }
    update(id, dto) {
        return this.purchasingService.updatePO(id, dto);
    }
    remove(id) {
        return this.purchasingService.removePO(id);
    }
};
exports.PurchasingController = PurchasingController;
__decorate([
    (0, common_1.Get)('orders'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Purchasing' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('direct'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Purchasing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "processDirectPurchase", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Purchasing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPO", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Purchasing' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('orders/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Purchasing' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('orders/:id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Purchasing' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "remove", null);
exports.PurchasingController = PurchasingController = __decorate([
    (0, common_1.Controller)('purchasing'),
    __metadata("design:paramtypes", [purchasing_service_1.PurchasingService])
], PurchasingController);
//# sourceMappingURL=purchasing.controller.js.map