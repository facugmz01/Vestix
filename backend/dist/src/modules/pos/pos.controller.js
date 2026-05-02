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
const scan_barcode_dto_1 = require("./dto/scan-barcode.dto");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
let PosController = class PosController {
    constructor(posService) {
        this.posService = posService;
    }
    async downloadPosCatalog() {
        return { status: 'SYNC_READY', data: [] };
    }
    async scanBarcode(scanDto) {
        return this.posService.resolveBarcode(scanDto.barcode);
    }
    async quickSale(body) {
        return this.posService.processQuickSale({
            branchId: 'mock-branch',
            warehouseId: 'mock-warehouse',
            variantId: body.variantId,
            categoryId: body.categoryId,
            accountId: body.accountId,
        });
    }
    async calculateCart(dto) {
        return this.posService.calculateCart(dto);
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
    (0, common_1.Post)('scan'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [scan_barcode_dto_1.ScanBarcodeDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "scanBarcode", null);
__decorate([
    (0, common_1.Post)('quick-sale'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "quickSale", null);
__decorate([
    (0, common_1.Post)('cart/calculate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Sales' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "calculateCart", null);
exports.PosController = PosController = __decorate([
    (0, common_1.Controller)('pos'),
    __metadata("design:paramtypes", [pos_service_1.PosService])
], PosController);
//# sourceMappingURL=pos.controller.js.map