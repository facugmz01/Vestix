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
const prisma_service_1 = require("../../core/prisma/prisma.service");
let CatalogService = class CatalogService {
    constructor(prisma, productsService, inventoryService, pricingService) {
        this.prisma = prisma;
        this.productsService = productsService;
        this.inventoryService = inventoryService;
        this.pricingService = pricingService;
    }
    async getPublicCatalog(filters) {
        const where = { isActive: true, isPublished: true };
        if (filters.categoryId)
            where.categoryId = filters.categoryId;
        if (filters.searchQuery)
            where.name = { contains: filters.searchQuery, mode: 'insensitive' };
        const products = await this.prisma.product.findMany({
            where,
            include: {
                brand: true,
                category: true,
                variants: {
                    include: {
                        stockLevels: true
                    }
                }
            }
        });
        const results = [];
        for (const product of products) {
            const primaryVariant = product.variants[0];
            if (!primaryVariant)
                continue;
            const basePrice = primaryVariant.basePrice;
            const resolvedPrice = await this.pricingService.resolvePrice(product.id, basePrice);
            if (filters.minPrice && resolvedPrice < filters.minPrice)
                continue;
            if (filters.maxPrice && resolvedPrice > filters.maxPrice)
                continue;
            const availableQty = product.variants.reduce((sum, v) => sum + v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0), 0);
            if (filters.inStockOnly && availableQty <= 0)
                continue;
            results.push({
                id: product.id,
                name: product.name,
                brand: product.brand?.name || null,
                category: product.category?.name || null,
                price: resolvedPrice,
                basePrice: basePrice,
                inStock: availableQty > 0,
                availableQuantity: availableQty,
                variants: product.variants.map(v => ({
                    id: v.id,
                    sku: v.sku,
                    size: v.size,
                    color: v.color,
                    stock: v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0)
                }))
            });
        }
        return {
            metadata: { total: results.length, filtered: Object.keys(filters).length > 0 },
            data: results
        };
    }
    async getPublicProduct(id) {
        const product = await this.prisma.product.findUnique({
            where: { id, isActive: true, isPublished: true },
            include: {
                brand: true,
                category: true,
                variants: {
                    include: { stockLevels: true }
                }
            }
        });
        if (!product)
            throw new Error('Product not found');
        const primaryVariant = product.variants[0];
        const basePrice = primaryVariant ? primaryVariant.basePrice : 0;
        const resolvedPrice = await this.pricingService.resolvePrice(product.id, basePrice);
        const availableQty = product.variants.reduce((sum, v) => sum + v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0), 0);
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            brand: product.brand?.name || null,
            category: product.category?.name || null,
            price: resolvedPrice,
            basePrice: basePrice,
            inStock: availableQty > 0,
            availableQuantity: availableQty,
            images: product.images,
            variants: product.variants.map(v => ({
                id: v.id,
                sku: v.sku,
                size: v.size,
                color: v.color,
                stock: v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0)
            }))
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_service_1.ProductsService,
        inventory_service_1.InventoryService,
        pricing_service_1.PricingService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map