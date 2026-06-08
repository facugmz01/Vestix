import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductVariant } from './models/variant.model';
import { VariantGeneratorService } from './variant-generator.service';
import { GenerateVariantsDto } from './dto/generate-variants.dto';
import * as crypto from 'crypto';

// import { ProductsService } from '../services/products.service'; // Used to validate the parent Product

@Injectable()
export class VariantsService {
  constructor(
    private readonly variantGenerator: VariantGeneratorService,
    // private readonly productsService: ProductsService
  ) {}

  private variants: ProductVariant[] = [];

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
    const existing = this.variants.some(v => generatedSkus.includes(v.sku));
    
    if (existing) {
      throw new ConflictException('SKU collision detected. One or more generated SKUs already exist for this product. Check attributes or use manual creation.');
    }

    // 4. Save to Database
    const savedVariants = newVariantsData.map(vData => ({
      id: crypto.randomUUID(),
      ...vData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    this.variants.push(...savedVariants);
    return savedVariants;
  }

  /**
   * Returns all sellable variants for a specific product.
   */
  async findByProduct(productId: string) {
    return this.variants.filter(v => v.productId === productId);
  }

  /**
   * Updates the base price of a specific variant.
   */
  async updatePrice(id: string, newPrice: number) {
    const idx = this.variants.findIndex(v => v.id === id);
    if (idx === -1) throw new NotFoundException(`Variant ${id} not found`);

    this.variants[idx].basePrice = newPrice;
    this.variants[idx].updatedAt = new Date();
    
    // In V2 Architecture, this would ideally fire a "PriceUpdatedEvent" 
    // to invalidate offline POS caches.
    
    return this.variants[idx];
  }
}
