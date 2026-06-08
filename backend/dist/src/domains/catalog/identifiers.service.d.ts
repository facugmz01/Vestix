import { PrismaService } from '../../core/prisma/prisma.service';
export declare class IdentifiersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private internalItemCounter;
    generateUniqueBarcode(): Promise<string>;
    generateVariantSku(productId: string, attributes?: string[]): Promise<string>;
    validateBarcodeUniqueness(barcode: string): Promise<boolean>;
    validateSkuUniqueness(sku: string): Promise<boolean>;
}
