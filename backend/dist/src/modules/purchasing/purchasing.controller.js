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
const purchasing_dto_1 = require("./dto/purchasing.dto");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let PurchasingController = class PurchasingController {
    constructor(purchasingService) {
        this.purchasingService = purchasingService;
    }
    createPO(createPurchaseOrderDto) {
        return this.purchasingService.createPO(createPurchaseOrderDto);
    }
    issuePO(id) {
        return this.purchasingService.issuePO(id);
    }
};
exports.PurchasingController = PurchasingController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Purchasing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchasing_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPO", null);
__decorate([
    (0, common_1.Patch)(':id/issue'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Purchasing' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "issuePO", null);
exports.PurchasingController = PurchasingController = __decorate([
    (0, common_1.Controller)('purchasing/orders'),
    __metadata("design:paramtypes", [purchasing_service_1.PurchasingService])
], PurchasingController);
//# sourceMappingURL=purchasing.controller.js.map