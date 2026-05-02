import { ProductVariant } from './models/variant.model';
import { VariantGeneratorService } from './variant-generator.service';
import { GenerateVariantsDto } from './dto/generate-variants.dto';
export declare class VariantsService {
    private readonly variantGenerator;
    constructor(variantGenerator: VariantGeneratorService);
    private variants;
    generateAndSave(productId: string, dto: GenerateVariantsDto): Promise<{
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        sku: string;
        barcode: string;
        basePrice: number;
        attributes: Record<string, string>;
        isActive: boolean;
        id: `${string}-${string}-${string}-${string}-${string}`;
    }[]>;
    findByProduct(productId: string): Promise<ProductVariant[]>;
    updatePrice(id: string, newPrice: number): Promise<ProductVariant>;
}
