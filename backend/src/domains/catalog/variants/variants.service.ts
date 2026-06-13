import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductVariant } from './models/variant.model';
import { VariantGeneratorService } from './variant-generator.service';
import { GenerateVariantsDto } from './dto/generate-variants.dto';
import * as crypto from 'crypto';

import { PrismaService } from '../../../core/prisma/prisma.service';
// import { ProductsService } from '../services/products.service'; // Used to validate the parent Product

@Injectable()
export class VariantsService {
  constructor(
    private readonly variantGenerator: VariantGeneratorService,
    private readonly prisma: PrismaService
    // private readonly productsService: ProductsService
  ) {}

  /**
   * Accepts a matrix payload, generates variants, validates uniqueness, and saves them.
   */
  async generateAndSave(productId: string, dto: GenerateVariantsDto) {
    // 1. Verify Parent Product Exists
    // const product = await this.productsService.findOne(productId);
    const mockProductBaseSku = 'MOCK-SKU'; // Mocking since DB is disconnected

    // 2. Execute Cartesian combination logic
    const newVariantsData = this.variantGenerator.generateCombinations(dto, productId, mockProductBaseSku);

    // 3. Prevent duplicate SKU collisions
    const generatedSkus = newVariantsData.map(v => v.sku);
    
    const existingCount = await this.prisma.productVariant.count({
      where: { sku: { in: generatedSkus } }
    });
    
    if (existingCount > 0) {
      throw new ConflictException('SKU collision detected. One or more generated SKUs already exist for this product. Check attributes or use manual creation.');
    }

    // 4. Save to Database
    const savedVariants = newVariantsData.map(vData => ({
      id: crypto.randomUUID(),
      productId,
      sku: vData.sku,
      barcode: vData.barcode || null,
      attributes: vData.attributes || {},
      basePrice: vData.basePrice,
      costPrice: (vData as any).costPrice || 0, // Fallback if missing
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await this.prisma.productVariant.createMany({
      data: savedVariants
    });

    return savedVariants;
  }

  /**
   * Returns all sellable variants for a specific product.
   */
  async findByProduct(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId }
    });
  }

  /**
   * Updates the base price of a specific variant.
   */
  async updatePrice(id: string, newPrice: number) {
    const variant = await this.prisma.productVariant.update({
      where: { id },
      data: { basePrice: newPrice }
    });
    
    if (!variant) throw new NotFoundException(`Variant ${id} not found`);
    
    // In V2 Architecture, this would ideally fire a "PriceUpdatedEvent" 
    // to invalidate offline POS caches.
    
    return variant;
  }
}
