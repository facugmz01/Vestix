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
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const catalog_service_1 = require("./catalog.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const create_variant_dto_1 = require("./dto/create-variant.dto");
const add_barcode_dto_1 = require("./dto/add-barcode.dto");
const jwt_auth_guard_1 = require("../../core/auth/jwt-auth.guard");
const roles_guard_1 = require("../../core/rbac/roles.guard");
const roles_decorator_1 = require("../../core/rbac/roles.decorator");
let CatalogController = class CatalogController {
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    createProduct(dto) {
        return this.catalogService.createProduct(dto);
    }
    addVariant(id, dto) {
        return this.catalogService.addVariantToProduct(id, dto);
    }
    addBarcode(id, dto) {
        return this.catalogService.addBarcodeToVariant(id, dto);
    }
    getPosSyncData() {
        return this.catalogService.findAllForPos();
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Post)('products'),
    (0, roles_decorator_1.Roles)('Store Manager', 'E-Commerce Manager'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Post)('products/:id/variants'),
    (0, roles_decorator_1.Roles)('Store Manager', 'E-Commerce Manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_variant_dto_1.CreateVariantDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "addVariant", null);
__decorate([
    (0, common_1.Post)('variants/:id/barcodes'),
    (0, roles_decorator_1.Roles)('Store Manager', 'E-Commerce Manager'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_barcode_dto_1.AddBarcodeDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "addBarcode", null);
__decorate([
    (0, common_1.Get)('pos-sync'),
    (0, roles_decorator_1.Roles)('Cashier', 'Store Manager'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getPosSyncData", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('catalog'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map