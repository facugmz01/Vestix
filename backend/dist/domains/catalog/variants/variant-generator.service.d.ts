import { GenerateVariantsDto } from './dto/generate-variants.dto';
export declare class VariantGeneratorService {
    generateCombinations(dto: GenerateVariantsDto, productId: string, baseSku: string): {
        productId: string;
        sku: string;
        barcode: string;
        basePrice: number;
        attributes: Record<string, string>;
        isActive: boolean;
    }[];
    private generateInternalBarcode;
}
