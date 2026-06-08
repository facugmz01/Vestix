"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../../core/prisma/prisma.module");
const products_service_1 = require("./services/products.service");
const taxonomy_service_1 = require("./services/taxonomy.service");
const catalog_controller_1 = require("./controllers/catalog.controller");
const pricing_service_1 = require("./pricing.service");
const pricing_controller_1 = require("./pricing.controller");
const promotions_controller_1 = require("./promotions.controller");
const rules_engine_service_1 = require("./rules-engine.service");
const catalog_service_1 = require("./catalog.service");
const catalog_controller_2 = require("./catalog.controller");
const identifiers_service_1 = require("./identifiers.service");
const identifiers_controller_1 = require("./identifiers.controller");
let CatalogModule = class CatalogModule {
};
exports.CatalogModule = CatalogModule;
exports.CatalogModule = CatalogModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [
            catalog_controller_1.ProductsController,
            catalog_controller_1.CategoriesController,
            catalog_controller_1.BrandsController,
            catalog_controller_1.VariantsController,
            catalog_controller_1.AttributesController,
            catalog_controller_1.PriceListController,
            pricing_controller_1.PricingController,
            promotions_controller_1.PromotionsController,
            catalog_controller_2.CatalogController,
            identifiers_controller_1.IdentifiersController,
        ],
        providers: [
            products_service_1.ProductsService,
            taxonomy_service_1.CategoriesService,
            taxonomy_service_1.BrandsService,
            taxonomy_service_1.AttributesService,
            taxonomy_service_1.PriceListService,
            pricing_service_1.PricingService,
            rules_engine_service_1.RulesEngineService,
            catalog_service_1.CatalogService,
            identifiers_service_1.IdentifiersService,
        ],
        exports: [
            products_service_1.ProductsService,
            taxonomy_service_1.CategoriesService,
            taxonomy_service_1.BrandsService,
            taxonomy_service_1.AttributesService,
            taxonomy_service_1.PriceListService,
            pricing_service_1.PricingService,
            rules_engine_service_1.RulesEngineService,
            catalog_service_1.CatalogService,
            identifiers_service_1.IdentifiersService,
        ],
    })
], CatalogModule);
//# sourceMappingURL=catalog.module.js.map