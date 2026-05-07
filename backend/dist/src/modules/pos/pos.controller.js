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
exports.PosController = void 0;
const common_1 = require("@nestjs/common");
const pos_service_1 = require("./pos.service");
const pos_dtos_1 = require("./dto/pos.dtos");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const current_user_decorator_1 = require("../../core/rbac/decorators/current-user.decorator");
let PosController = class PosController {
    constructor(posService) {
        this.posService = posService;
    }
    async downloadPosCatalog() {
        return this.posService.getCatalogSyncData();
    }
    async searchCatalog(q) {
        return this.posService.searchCatalog(q);
    }
    async scanBarcode(scanDto) {
        return this.posService.resolveBarcode(scanDto.barcode);
    }
    async quickSale(dto) {
        return this.posService.processQuickSale(dto);
    }
    async calculateCart(dto) {
        return this.posService.calculateCart(dto);
    }
    async getCurrentSession(registerId) {
        return this.posService.getCurrentSession(registerId);
    }
    async getRegisters(branchId) {
        return this.posService.getRegisters(branchId);
    }
    async openSession(dto, userId) {
        return this.posService.openSession({ ...dto, userId });
    }
    async closeSession(dto, userId) {
        return this.posService.closeSession({ ...dto, userId });
    }
};
exports.PosController = PosController;
__decorate([
    (0, common_1.Get)('sync/catalog'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PosController.prototype, "downloadPosCatalog", null);
__decorate([
    (0, common_1.Get)('catalog/search'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "searchCatalog", null);
__decorate([
    (0, common_1.Post)('scan'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_dtos_1.ScanBarcodeDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "scanBarcode", null);
__decorate([
    (0, common_1.Post)('quick-sale'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_dtos_1.QuickSaleDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "quickSale", null);
__decorate([
    (0, common_1.Post)('cart/calculate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_dtos_1.CalculateCartDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "calculateCart", null);
__decorate([
    (0, common_1.Get)('session/current'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Query)('registerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getCurrentSession", null);
__decorate([
    (0, common_1.Get)('registers'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getRegisters", null);
__decorate([
    (0, common_1.Post)('session/open'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_dtos_1.OpenSessionDto, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "openSession", null);
__decorate([
    (0, common_1.Post)('session/close'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_dtos_1.CloseSessionDto, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "closeSession", null);
exports.PosController = PosController = __decorate([
    (0, common_1.Controller)('pos'),
    __metadata("design:paramtypes", [pos_service_1.PosService])
], PosController);
//# sourceMappingURL=pos.controller.js.map