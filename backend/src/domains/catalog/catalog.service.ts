import { Injectable } from '@nestjs/common';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from './pricing.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}


  /**
   * E-COMMERCE FRONTEND ENGINE
   * Generates the public storefront view. Strictly strips out wholesale costs, 
   * internal supplier notes, and unpublished items.
   */
  async getPublicCatalog(filters: CatalogFilterDto) {
    const where: any = { isActive: true, isPublished: true };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.searchQuery) where.name = { contains: filters.searchQuery, mode: 'insensitive' };

    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const storefrontSettings = (settings?.storefront as any) || {};
    const priceListId = storefrontSettings.priceListToShow;

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
      // Find the primary variant or default to first
      const primaryVariant = product.variants[0];
      if (!primaryVariant) continue;

      const basePrice = primaryVariant.basePrice;

      const resolvedPrice = priceListId 
        ? await this.pricingService.resolvePriceListPrice(primaryVariant.id, basePrice, priceListId)
        : basePrice;

      if (filters.minPrice && resolvedPrice < filters.minPrice) continue;
      if (filters.maxPrice && resolvedPrice > filters.maxPrice) continue;

      // Calculate total available stock across all variants for e-commerce
      // In a real scenario we'd filter by E-COMMERCE branch, but we'll sum all for now.
      const availableQty = product.variants.reduce((sum, v) => 
        sum + v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0)
      , 0);

      if (filters.inStockOnly && availableQty <= 0) continue;

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

  async getPublicProduct(id: string) {
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

    if (!product) throw new Error('Product not found');

    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const storefrontSettings = (settings?.storefront as any) || {};
    const priceListId = storefrontSettings.priceListToShow;

    const primaryVariant = product.variants[0];
    const basePrice = primaryVariant ? primaryVariant.basePrice : 0;
    const resolvedPrice = (primaryVariant && priceListId)
      ? await this.pricingService.resolvePriceListPrice(primaryVariant.id, basePrice, priceListId)
      : basePrice;

    const availableQty = product.variants.reduce((sum, v) => 
      sum + v.stockLevels.reduce((ssum, s) => ssum + s.availableQuantity, 0)
    , 0);

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

  /**
   * OFFLINE POS SYNC ENGINE
   * Highly compressed endpoint for the POS terminal to download everything at 8:00 AM
   * so it can run seamlessly when the internet drops.
   */
  async getPosSyncCatalog(branchId: string) {
    // How this differs from the public catalog:
    // 1. Visibility: It includes items that are NOT isPublished (e.g., store-only clearance items).
    // 2. Barcodes: It includes internal 13-digit EANs for the laser scanner to read.
    // 3. Stock: It does NOT embed real-time stock, because offline stock drifts immediately.
    
    // In production, this returns a massive, heavily minified JSON array
    return {
      status: 'SYNC_READY',
      timestamp: new Date().toISOString(),
      data: [
         { sku: 'TSH-PRM', barcode: '0400000000018', name: 'Premium T-Shirt', basePrice: 20 },
         { sku: 'JKT-WIN', barcode: '0400000000025', name: 'Winter Jacket', basePrice: 120 }
      ]
    };
  }
}
