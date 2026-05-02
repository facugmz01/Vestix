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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("../products/services/products.service");
const inventory_service_1 = require("../inventory/inventory.service");
const pricing_service_1 = require("../pricing/pricing.service");
let CatalogService = class CatalogService {
    constructor(productsService, inventoryService, pricingService) {
        this.productsService = productsService;
        this.inventoryService = inventoryService;
        this.pricingService = pricingService;
    }
    async getPublicCatalog(filters) {
        const mockProducts = [
            { id: 'prod-1', name: 'Premium T-Shirt', categoryId: 'cat-1', brandId: 'brand-1', basePrice: 20 },
            { id: 'prod-2', name: 'Winter Jacket', categoryId: 'cat-2', brandId: 'brand-1', basePrice: 120 }
        ];
        const results = [];
        for (const product of mockProducts) {
            if (filters.categoryId && product.categoryId !== filters.categoryId)
                continue;
            if (filters.searchQuery && !product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()))
                continue;
            const resolvedPrice = await this.pricingService.resolvePrice(product.id, product.basePrice);
            if (filters.minPrice && resolvedPrice < filters.minPrice)
                continue;
            if (filters.maxPrice && resolvedPrice > filters.maxPrice)
                continue;
            const stock = await this.inventoryService.getStockPerBranch('E-COMMERCE-BRANCH', product.id);
            const availableQty = stock.reduce((sum, lvl) => sum + lvl.availableQuantity, 0);
            if (filters.inStockOnly && availableQty <= 0)
                continue;
            results.push({
                id: product.id,
                name: product.name,
                price: resolvedPrice,
                inStock: availableQty > 0,
                availableQuantity: availableQty,
            });
        }
        return {
            metadata: { total: results.length, filtered: Object.keys(filters).length > 0 },
            data: results
        };
    }
    async getPosSyncCatalog(branchId) {
        return {
            status: 'SYNC_READY',
            timestamp: new Date().toISOString(),
            data: [
                { sku: 'TSH-PRM', barcode: '0400000000018', name: 'Premium T-Shirt', basePrice: 20 },
                { sku: 'JKT-WIN', barcode: '0400000000025', name: 'Winter Jacket', basePrice: 120 }
            ]
        };
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        inventory_service_1.InventoryService,
        pricing_service_1.PricingService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map