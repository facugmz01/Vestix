import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from './pricing.service';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly settingsService: SettingsService,
  ) {}

  async getPublicCatalog(filters: CatalogFilterDto) {
    const where: any = { isActive: true, isPublished: true };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.brandId || filters.brand) where.brandId = filters.brandId || filters.brand;

    if (filters.searchQuery) {
      where.OR = [
        { name: { contains: filters.searchQuery, mode: 'insensitive' } },
        { baseSku: { contains: filters.searchQuery, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: filters.searchQuery, mode: 'insensitive' } } } },
      ];
    }

    const storefrontSettings = await this.settingsService.getStorefrontSettings();
    const hidePrices = Boolean(storefrontSettings.hidePrices);
    const priceListId = hidePrices ? null : storefrontSettings.priceListToShow;

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;

    let orderBy: any = { name: 'asc' };
    if (filters.sortBy === 'NEWEST') orderBy = { createdAt: 'desc' };

    const products = await this.prisma.product.findMany({
      where,
      include: { variants: { where: { isActive: true } } },
      orderBy,
    });

    const categoryIds = [...new Set(products.map(p => p.categoryId))].filter(Boolean);
    const brandIds = [...new Set(products.map(p => p.brandId))].filter(Boolean);
    const variantIds = products.flatMap(p => p.variants.map(v => v.id));

    const [categories, brands, stockLevels, priceMap] = await Promise.all([
      this.prisma.category.findMany({ where: { id: { in: categoryIds } } }),
      this.prisma.brand.findMany({ where: { id: { in: brandIds } } }),
      this.prisma.stockLevel.findMany({ where: { variantId: { in: variantIds } } }),
      priceListId
        ? this.pricingService.resolvePricesForVariants(variantIds, priceListId)
        : Promise.resolve(new Map<string, number>()),
    ]);

    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const brandMap = new Map(brands.map(b => [b.id, b.name]));

    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    const results = [];

    for (const product of products) {
      if (!product.variants.length) continue;

      const mappedVariants = product.variants.map(v => {
        const variantStocks = stockByVariant.get(v.id) || [];
        const stock = variantStocks.reduce((ssum, s) => ssum + s.availableQuantity, 0);
        const resolved = hidePrices ? 0 : priceListId ? (priceMap.get(v.id) ?? v.basePrice) : v.basePrice;
        return {
          id: v.id,
          sku: v.sku,
          size: v.size,
          color: v.color,
          stock,
          price: resolved,
          basePrice: hidePrices ? 0 : v.basePrice,
        };
      });

      const inStockVariants = mappedVariants.filter(v => v.stock > 0);
      const pricePool = (inStockVariants.length ? inStockVariants : mappedVariants).map(v => v.price);
      const basePool = mappedVariants.map(v => v.basePrice);
      const resolvedPrice = hidePrices ? 0 : pricePool.length ? Math.min(...pricePool) : 0;
      const basePrice = hidePrices ? 0 : basePool.length ? Math.min(...basePool) : 0;
      const availableQty = mappedVariants.reduce((sum, v) => sum + v.stock, 0);

      if (!hidePrices) {
        if (filters.minPrice && resolvedPrice < filters.minPrice) continue;
        if (filters.maxPrice && resolvedPrice > filters.maxPrice) continue;
      }
      if (filters.inStockOnly && availableQty <= 0) continue;

      if (filters.attributes?.length) {
        const matches = filters.attributes.every(attr =>
          product.variants.some(v => {
            const attrs = (v.attributes || {}) as Record<string, string>;
            return attrs[attr.key] === attr.value;
          }),
        );
        if (!matches) continue;
      }

      results.push({
        id: product.id,
        name: product.name,
        brand: product.brandId ? brandMap.get(product.brandId) || null : null,
        category: product.categoryId ? categoryMap.get(product.categoryId) || null : null,
        price: resolvedPrice,
        maxPrice: hidePrices ? 0 : pricePool.length ? Math.max(...pricePool) : resolvedPrice,
        basePrice,
        inStock: availableQty > 0,
        availableQuantity: availableQty,
        images: product.images || [],
        createdAt: product.createdAt,
        variants: mappedVariants,
      });
    }

    if (!hidePrices && filters.sortBy === 'PRICE_ASC') {
      results.sort((a, b) => a.price - b.price);
    } else if (!hidePrices && filters.sortBy === 'PRICE_DESC') {
      results.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'NEWEST') {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }

    const startIndex = (page - 1) * pageSize;
    const paginatedResults = results.slice(startIndex, startIndex + pageSize);

    return {
      metadata: { total: results.length, filtered: Object.keys(filters).length > 0, page, pageSize },
      data: paginatedResults,
    };
  }

  async getPublicCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async getPublicBrands() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
  }

  async getPublicProduct(id: string, preview = false) {
    const product = await this.prisma.product.findFirst({
      where: preview
        ? { id, isActive: true }
        : { id, isActive: true, isPublished: true },
      include: { variants: { where: { isActive: true } } },
    });

    if (!product) throw new NotFoundException('Product not found');

    const variantIds = product.variants.map(v => v.id);
    const [category, brand, stockLevels, storefrontSettings] = await Promise.all([
      product.categoryId ? this.prisma.category.findUnique({ where: { id: product.categoryId } }) : null,
      product.brandId ? this.prisma.brand.findUnique({ where: { id: product.brandId } }) : null,
      this.prisma.stockLevel.findMany({ where: { variantId: { in: variantIds } } }),
      this.settingsService.getStorefrontSettings(),
    ]);

    const hidePrices = Boolean(storefrontSettings.hidePrices);
    const priceListId = hidePrices ? null : storefrontSettings.priceListToShow;
    const priceMap = priceListId
      ? await this.pricingService.resolvePricesForVariants(variantIds, priceListId)
      : new Map<string, number>();

    const stockByVariant = new Map<string, typeof stockLevels>();
    for (const stock of stockLevels) {
      const arr = stockByVariant.get(stock.variantId) || [];
      arr.push(stock);
      stockByVariant.set(stock.variantId, arr);
    }

    const mappedVariants = product.variants.map(v => {
      const variantStocks = stockByVariant.get(v.id) || [];
      const stock = variantStocks.reduce((ssum, s) => ssum + s.availableQuantity, 0);
      const resolved = hidePrices ? 0 : priceListId ? (priceMap.get(v.id) ?? v.basePrice) : v.basePrice;
      return {
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        stock,
        price: resolved,
        basePrice: hidePrices ? 0 : v.basePrice,
        attributes: v.attributes,
      };
    });

    const inStockVariants = mappedVariants.filter(v => v.stock > 0);
    const pricePool = (inStockVariants.length ? inStockVariants : mappedVariants).map(v => v.price);
    const resolvedPrice = hidePrices ? 0 : pricePool.length ? Math.min(...pricePool) : 0;
    const basePrice = hidePrices ? 0 : mappedVariants.length ? Math.min(...mappedVariants.map(v => v.basePrice)) : 0;
    const availableQty = mappedVariants.reduce((sum, v) => sum + v.stock, 0);

    const metadata = (product.metadata || {}) as Record<string, any>;
    const relatedIds: string[] = Array.isArray(metadata.relatedProductIds) ? metadata.relatedProductIds : [];
    let relatedProducts: any[] = [];

    if (relatedIds.length) {
      const related = await this.prisma.product.findMany({
        where: preview
          ? { id: { in: relatedIds }, isActive: true }
          : { id: { in: relatedIds }, isActive: true, isPublished: true },
        include: { variants: { where: { isActive: true } } },
      });

      const relVariantIds = related.flatMap(p => p.variants.map(v => v.id));
      const relPriceMap = priceListId
        ? await this.pricingService.resolvePricesForVariants(relVariantIds, priceListId)
        : new Map<string, number>();

      relatedProducts = related.map(p => {
        const prices = p.variants.map(v => relPriceMap.get(v.id) ?? v.basePrice);
        const minPrice = hidePrices ? 0 : prices.length ? Math.min(...prices) : 0;
        return {
          id: p.id,
          name: p.name,
          price: minPrice,
          images: p.images,
        };
      });
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      brand: brand?.name || null,
      category: category?.name || null,
      price: resolvedPrice,
      maxPrice: hidePrices ? 0 : pricePool.length ? Math.max(...pricePool) : resolvedPrice,
      basePrice,
      inStock: availableQty > 0,
      availableQuantity: availableQty,
      images: product.images,
      variants: mappedVariants,
      relatedProducts,
    };
  }

  /** @deprecated Use GET /pos/sync/catalog instead */
  async getPosSyncCatalog(_branchId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { isActive: true },
      include: { product: true, barcodes: true },
    });

    return {
      status: 'SYNC_READY',
      timestamp: new Date().toISOString(),
      deprecated: true,
      useInstead: '/api/pos/sync/catalog',
      data: variants.map(v => ({
        id: v.id,
        productId: v.productId,
        sku: v.sku,
        barcode: v.barcode,
        primaryBarcode: v.barcode,
        allBarcodes: [v.barcode, ...v.barcodes.map(b => b.barcode)].filter(Boolean),
        name: v.product.name,
        categoryId: v.product.categoryId,
        basePrice: v.basePrice,
      })),
    };
  }

  async repriceUsd(usdType: 'Oficial' | 'Blue') {
    return this.settingsService.repriceUsd(usdType);
  }
}
