import { Injectable } from '@nestjs/common';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { ProductsService } from '../products/services/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class CatalogService {
  constructor(
    // In production, the Catalog read model is typically heavily optimized via a single 
    // Prisma/Postgres query or an ElasticSearch index. We inject these domain services 
    // to illustrate the architectural logic of how the data is combined.
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly pricingService: PricingService
  ) {}

  /**
   * E-COMMERCE FRONTEND ENGINE
   * Generates the public storefront view. Strictly strips out wholesale costs, 
   * internal supplier notes, and unpublished items.
   */
  async getPublicCatalog(filters: CatalogFilterDto) {
    // 1. Fetch only ACTIVE and PUBLISHED base products
    // const products = await this.prisma.product.findMany({ where: { isActive: true, isPublished: true, ... }})
    const mockProducts = [
      { id: 'prod-1', name: 'Premium T-Shirt', categoryId: 'cat-1', brandId: 'brand-1', basePrice: 20 },
      { id: 'prod-2', name: 'Winter Jacket', categoryId: 'cat-2', brandId: 'brand-1', basePrice: 120 }
    ];

    const results = [];

    for (const product of mockProducts) {
      if (filters.categoryId && product.categoryId !== filters.categoryId) continue;
      if (filters.searchQuery && !product.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) continue;

      // 2. Dynamic Pricing Resolution
      // The public catalog defaults to the RETAIL price list.
      const resolvedPrice = await this.pricingService.resolvePrice(product.id, product.basePrice);

      if (filters.minPrice && resolvedPrice < filters.minPrice) continue;
      if (filters.maxPrice && resolvedPrice > filters.maxPrice) continue;

      // 3. Omni-Channel Availability Check
      // We explicitly check stock allocated to the E-COMMERCE branch.
      // We don't want to show an item "In Stock" online if it's only available in the physical shop.
      const stock = this.inventoryService.getStockPerBranch('E-COMMERCE-BRANCH', product.id);
      const availableQty = stock.reduce((sum, lvl) => sum + lvl.availableQuantity, 0);

      if (filters.inStockOnly && availableQty <= 0) continue;

      results.push({
        id: product.id,
        name: product.name,
        price: resolvedPrice,
        inStock: availableQty > 0,
        availableQuantity: availableQty, // Used to set max purchase limits in the UI
      });
    }

    return {
      metadata: { total: results.length, filtered: Object.keys(filters).length > 0 },
      data: results
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
