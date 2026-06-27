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
            const resolvedPrice = priceListId
                ? await this.pricingService.resolvePriceListPrice(primaryVariant.id, basePrice, priceListId)
                : basePrice;
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
                images: product.images || [],
                variants: product.variants.map(v => ({
                    id: v.id,
                    sku: v.sku,
                    size: v.size,
                    color: v.color,
                    stock: v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0)
                }))
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
                brand: true,
                category: true,
                variants: {
                    include: { stockLevels: true }
                }
            }
        });
        if (!product)
            throw new Error('Product not found');
        const storefrontSettings = await this.settingsService.getStorefrontSettings();
        const priceListId = storefrontSettings.priceListToShow;
        const primaryVariant = product.variants[0];
        const basePrice = primaryVariant ? primaryVariant.basePrice : 0;
        const resolvedPrice = (primaryVariant && priceListId)
            ? await this.pricingService.resolvePriceListPrice(primaryVariant.id, basePrice, priceListId)
            : basePrice;
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