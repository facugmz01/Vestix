import { VariantGeneratorService } from './variant-generator.service';
import { GenerateVariantsDto } from './dto/generate-variants.dto';
import { PrismaService } from '../../../core/prisma/prisma.service';
export declare class VariantsService {
    private readonly variantGenerator;
    private readonly prisma;
    constructor(variantGenerator: VariantGeneratorService, prisma: PrismaService);
    generateAndSave(productId: string, dto: GenerateVariantsDto): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        productId: string;
        sku: string;
        barcode: string;
        attributes: Record<string, string>;
        basePrice: number;
        costPrice: any;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findByProduct(productId: string): Promise<{
        id: string;
        productId: string;
        sku: string;
        barcode: string | null;
        size: string | null;
        color: string | null;
        imageUrl: string | null;
        costPrice: number;
        basePrice: number;
        isActive: boolean;
        attributes: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updatePrice(id: string, newPrice: number): Promise<{
        id: string;
        productId: string;
        sku: string;
        barcode: string | null;
        size: string | null;
        color: string | null;
        imageUrl: string | null;
        costPrice: number;
        basePrice: number;
        isActive: boolean;
        attributes: import(".prisma/client").Prisma.JsonValue;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
