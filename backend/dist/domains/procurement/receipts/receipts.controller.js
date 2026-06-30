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
exports.ReceiptsController = void 0;
const common_1 = require("@nestjs/common");
const goods_receipt_service_1 = require("./goods-receipt.service");
const require_permissions_decorator_1 = require("../../../core/rbac/decorators/require-permissions.decorator");
let ReceiptsController = class ReceiptsController {
    constructor(receiptsService) {
        this.receiptsService = receiptsService;
    }
    findAll(query) {
        return this.receiptsService.findAll(query);
    }
    findOne(id) {
        return this.receiptsService.findOne(id);
    }
    draft(dto) {
        return this.receiptsService.draftReceipt(dto);
    }
    validate(id, dto) {
        return this.receiptsService.validateReceipt(id, dto.branchId, dto.approvedByUserId);
    }
};
exports.ReceiptsController = ReceiptsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Purchasing' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReceiptsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Purchasing' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ReceiptsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('draft'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Purchasing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReceiptsController.prototype, "draft", null);
__decorate([
    (0, common_1.Post)(':id/validate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Purchasing' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReceiptsController.prototype, "validate", null);
exports.ReceiptsController = ReceiptsController = __decorate([
    (0, common_1.Controller)('purchasing/receipts'),
    __metadata("design:paramtypes", [goods_receipt_service_1.GoodsReceiptService])
], ReceiptsController);
//# sourceMappingURL=receipts.controller.js.map