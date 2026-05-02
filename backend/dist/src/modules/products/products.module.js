"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../core/prisma/prisma.module");
const products_service_1 = require("./services/products.service");
const taxonomy_service_1 = require("./services/taxonomy.service");
const catalog_controller_1 = require("./controllers/catalog.controller");
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [catalog_controller_1.ProductsController, catalog_controller_1.CategoriesController, catalog_controller_1.BrandsController, catalog_controller_1.VariantsController, catalog_controller_1.AttributesController, catalog_controller_1.PriceListController],
        providers: [products_service_1.ProductsService, taxonomy_service_1.CategoriesService, taxonomy_service_1.BrandsService, taxonomy_service_1.AttributesService, taxonomy_service_1.PriceListService],
        exports: [products_service_1.ProductsService],
    })
], ProductsModule);
//# sourceMappingURL=products.module.js.map