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
exports.PriceListController = exports.AttributesController = exports.VariantsController = exports.ProductsController = exports.BrandsController = exports.CategoriesController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("../services/products.service");
const taxonomy_service_1 = require("../services/taxonomy.service");
const create_product_dto_1 = require("../dto/create-product.dto");
const update_product_dto_1 = require("../dto/update-product.dto");
const create_category_dto_1 = require("../dto/create-category.dto");
const create_brand_dto_1 = require("../dto/create-brand.dto");
const create_attribute_dto_1 = require("../dto/create-attribute.dto");
const create_price_list_dto_1 = require("../dto/create-price-list.dto");
const update_price_list_dto_1 = require("../dto/update-price-list.dto");
const bulk_product_dto_1 = require("../dto/bulk-product.dto");
const bulk_update_prices_dto_1 = require("../dto/bulk-update-prices.dto");
const require_permissions_decorator_1 = require("../../../core/rbac/decorators/require-permissions.decorator");
let CategoriesController = class CategoriesController {
    constructor(categoriesService) {
        this.categoriesService = categoriesService;
    }
    create(createCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }
    findAll() {
        return this.categoriesService.findAll();
    }
    update(id, dto) {
        return this.categoriesService.update(id, dto);
    }
    remove(id) {
        return this.categoriesService.delete(id);
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_category_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'delete', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CategoriesController.prototype, "remove", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [taxonomy_service_1.CategoriesService])
], CategoriesController);
let BrandsController = class BrandsController {
    constructor(brandsService) {
        this.brandsService = brandsService;
    }
    create(createBrandDto) {
        return this.brandsService.create(createBrandDto);
    }
    findAll() {
        return this.brandsService.findAll();
    }
    update(id, dto) {
        return this.brandsService.update(id, dto);
    }
    remove(id) {
        return this.brandsService.delete(id);
    }
};
exports.BrandsController = BrandsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_brand_dto_1.CreateBrandDto]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'delete', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BrandsController.prototype, "remove", null);
exports.BrandsController = BrandsController = __decorate([
    (0, common_1.Controller)('brands'),
    __metadata("design:paramtypes", [taxonomy_service_1.BrandsService])
], BrandsController);
let ProductsController = class ProductsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    create(createProductDto) {
        return this.productsService.create(createProductDto);
    }
    bulkValidate(dto) {
        return this.productsService.bulkValidate(dto);
    }
    bulkImport(dto) {
        return this.productsService.bulkImport(dto);
    }
    bulkUpdatePrices(dto) {
        return this.productsService.bulkUpdatePrices(dto);
    }
    findAll(query) {
        return this.productsService.findAll(query);
    }
    findOne(id) {
        return this.productsService.findOne(id);
    }
    findVariants(id) {
        return this.productsService.findVariants(id);
    }
    createVariant(id, data) {
        return this.productsService.createVariant(id, data);
    }
    generateCombinations(id, dto) {
        return this.productsService.generateCombinations(id, dto);
    }
    update(id, updateProductDto) {
        return this.productsService.update(id, updateProductDto);
    }
    remove(id) {
        return this.productsService.remove(id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk-validate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_product_dto_1.BulkValidateDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulkValidate", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_product_dto_1.BulkImportDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Post)('bulk-update-prices'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_update_prices_dto_1.BulkUpdatePricesDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "bulkUpdatePrices", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/variants'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findVariants", null);
__decorate([
    (0, common_1.Post)(':id/variants'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "createVariant", null);
__decorate([
    (0, common_1.Post)(':id/variants/generate'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "generateCombinations", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_dto_1.UpdateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'delete', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
let VariantsController = class VariantsController {
    constructor(productsService) {
        this.productsService = productsService;
    }
    findAll(search) {
        return this.productsService.findAllVariants(search);
    }
    update(id, data) {
        return this.productsService.updateVariant(id, data);
    }
    delete(id) {
        return this.productsService.deleteVariant(id);
    }
};
exports.VariantsController = VariantsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VariantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VariantsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'delete', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VariantsController.prototype, "delete", null);
exports.VariantsController = VariantsController = __decorate([
    (0, common_1.Controller)('variants'),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], VariantsController);
let AttributesController = class AttributesController {
    constructor(attributesService) {
        this.attributesService = attributesService;
    }
    findAll() {
        return this.attributesService.findAll();
    }
    create(data) {
        return this.attributesService.create(data);
    }
    update(id, data) {
        return this.attributesService.update(id, data);
    }
    delete(id) {
        return this.attributesService.delete(id);
    }
};
exports.AttributesController = AttributesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AttributesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_attribute_dto_1.CreateAttributeDto]),
    __metadata("design:returntype", void 0)
], AttributesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttributesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'delete', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttributesController.prototype, "delete", null);
exports.AttributesController = AttributesController = __decorate([
    (0, common_1.Controller)('attributes'),
    __metadata("design:paramtypes", [taxonomy_service_1.AttributesService])
], AttributesController);
let PriceListController = class PriceListController {
    constructor(priceListService) {
        this.priceListService = priceListService;
    }
    findAll() {
        return this.priceListService.findAll();
    }
    create(data) {
        return this.priceListService.create(data);
    }
    update(id, data) {
        return this.priceListService.update(id, data);
    }
    delete(id) {
        return this.priceListService.delete(id);
    }
};
exports.PriceListController = PriceListController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Catalog' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PriceListController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'create', subject: 'Catalog' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_price_list_dto_1.CreatePriceListDto]),
    __metadata("design:returntype", void 0)
], PriceListController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'update', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_price_list_dto_1.UpdatePriceListDto]),
    __metadata("design:returntype", void 0)
], PriceListController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'delete', subject: 'Catalog' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PriceListController.prototype, "delete", null);
exports.PriceListController = PriceListController = __decorate([
    (0, common_1.Controller)('pricing'),
    __metadata("design:paramtypes", [taxonomy_service_1.PriceListService])
], PriceListController);
//# sourceMappingURL=catalog.controller.js.map