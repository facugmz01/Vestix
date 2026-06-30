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
const prisma_service_1 = require("../../core/prisma/prisma.service");
const pricing_service_1 = require("./pricing.service");
const settings_service_1 = require("../../modules/settings/settings.service");
let CatalogService = class CatalogService {
    constructor(prisma, pricingService, settingsService) {
        this.prisma = prisma;
        this.pricingService = pricingService;
        this.settingsService = settingsService;
    }
    async getPublicCatalog(filters) {
        const where = { isActive: true, isPublished: true };
        if (filters.categoryId)
            where.categoryId = filters.categoryId;
        if (filters.brandId || filters.brand)
            where.brandId = filters.brandId || filters.brand;
        if (filters.searchQuery) {
            where.OR = [
                { name: { contains: filters.searchQuery, mode: 'insensitive' } },
                { baseSku: { contains: filters.searchQuery, mode: 'insensitive' } },
            ];
        }
        const storefrontSettings = await this.settingsService.getStorefrontSettings();
        const priceListId = storefrontSettings.priceListToShow;
        let products = await this.prisma.product.findMany({
            where,
            include: {
                variants: true
            }
        });
        const categoryIds = [...new Set(products.map(p => p.categoryId))].filter(Boolean);
        const brandIds = [...new Set(products.map(p => p.brandId))].filter(Boolean);
        const variantIds = products.flatMap(p => p.variants.map(v => v.id));
        const [categories, brands, stockLevels] = await Promise.all([
            this.prisma.category.findMany({ where: { id: { in: categoryIds } } }),
            this.prisma.brand.findMany({ where: { id: { in: brandIds } } }),
            this.prisma.stockLevel.findMany({ where: { variantId: { in: variantIds } } })
        ]);
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));
        const brandMap = new Map(brands.map(b => [b.id, b.name]));
        const stockByVariant = new Map();
        for (const stock of stockLevels) {
            const arr = stockByVariant.get(stock.variantId) || [];
            arr.push(stock);
            stockByVariant.set(stock.variantId, arr);
        }
        const results = [];
        for (const product of products) {
            const primaryVariant = product.variants[0];
            if (!primaryVariant)
                continue;
            const basePrice = primaryVariant.basePrice;
            const resolvedPrice = priceListId
                ? await this.pricingService.resolvePriceListPrice(primaryVariant.id, basePrice, priceListId)
                : basePrice;
            if (filters.minPrice && resolvedPrice < filters.minPrice)
                continue;
            if (filters.maxPrice && resolvedPrice > filters.maxPrice)
                continue;
            const availableQty = product.variants.reduce((sum, v) => {
                const variantStocks = stockByVariant.get(v.id) || [];
                return sum + variantStocks.reduce((ssum, s) => ssum + s.availableQuantity, 0);
            }, 0);
            if (filters.inStockOnly && availableQty <= 0)
                continue;
            const brandName = product.brandId ? brandMap.get(product.brandId) : null;
            const categoryName = product.categoryId ? categoryMap.get(product.categoryId) : null;
            results.push({
                id: product.id,
                name: product.name,
                brand: brandName || null,
                category: categoryName || null,
                price: resolvedPrice,
                basePrice: basePrice,
                inStock: availableQty > 0,
                availableQuantity: availableQty,
                images: product.images || [],
                variants: product.variants.map(v => {
                    const variantStocks = stockByVariant.get(v.id) || [];
                    return {
                        id: v.id,
                        sku: v.sku,
                        size: v.size,
                        color: v.color,
                        stock: variantStocks.reduce((ssum, s) => ssum + s.availableQuantity, 0)
                    };
                })
            });
        }
        if (filters.sortBy === 'PRICE_ASC') {
            results.sort((a, b) => a.price - b.price);
        }
        else if (filters.sortBy === 'PRICE_DESC') {
            results.sort((a, b) => b.price - a.price);
        }
        else {
            results.sort((a, b) => a.name.localeCompare(b.name));
        }
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 50;
        const startIndex = (page - 1) * pageSize;
        const paginatedResults = results.slice(startIndex, startIndex + pageSize);
        return {
            metadata: { total: results.length, filtered: Object.keys(filters).length > 0, page, pageSize },
            data: paginatedResults
        };
    }
    async getPublicProduct(id) {
        const product = await this.prisma.product.findUnique({
            where: { id, isActive: true, isPublished: true },
            include: {
                variants: true
            }
        });
        if (!product)
            throw new Error('Product not found');
        const variantIds = product.variants.map(v => v.id);
        const [category, brand, stockLevels] = await Promise.all([
            product.categoryId ? this.prisma.category.findUnique({ where: { id: product.categoryId } }) : null,
            product.brandId ? this.prisma.brand.findUnique({ where: { id: product.brandId } }) : null,
            this.prisma.stockLevel.findMany({ where: { variantId: { in: variantIds } } })
        ]);
        const stockByVariant = new Map();
        for (const stock of stockLevels) {
            const arr = stockByVariant.get(stock.variantId) || [];
            arr.push(stock);
            stockByVariant.set(stock.variantId, arr);
        }
        const storefrontSettings = await this.settingsService.getStorefrontSettings();
        const priceListId = storefrontSettings.priceListToShow;
        const primaryVariant = product.variants[0];
        const basePrice = primaryVariant ? primaryVariant.basePrice : 0;
        const resolvedPrice = (primaryVariant && priceListId)
            ? await this.pricingService.resolvePriceListPrice(primaryVariant.id, basePrice, priceListId)
            : basePrice;
        const availableQty = product.variants.reduce((sum, v) => {
            const variantStocks = stockByVariant.get(v.id) || [];
            return sum + variantStocks.reduce((ssum, s) => ssum + s.availableQuantity, 0);
        }, 0);
        return {
            id: product.id,
            name: product.name,
            description: product.description,
            brand: brand?.name || null,
            category: category?.name || null,
            price: resolvedPrice,
            basePrice: basePrice,
            inStock: availableQty > 0,
            availableQuantity: availableQty,
            images: product.images,
            variants: product.variants.map(v => {
                const variantStocks = stockByVariant.get(v.id) || [];
                return {
                    id: v.id,
                    sku: v.sku,
                    size: v.size,
                    color: v.color,
                    stock: variantStocks.reduce((ssum, s) => ssum + s.availableQuantity, 0)
                };
            })
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
    async repriceUsd(usdType) {
        return this.settingsService.repriceUsd(usdType);
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pricing_service_1.PricingService,
        settings_service_1.SettingsService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map