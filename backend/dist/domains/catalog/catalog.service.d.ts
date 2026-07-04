import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from './pricing.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class CatalogService {
    private readonly prisma;
    private readonly pricingService;
    private readonly settingsService;
    constructor(prisma: PrismaService, pricingService: PricingService, settingsService: SettingsService);
    getPublicCatalog(filters: CatalogFilterDto): Promise<{
        metadata: {
            total: number;
            filtered: boolean;
            page: number;
            pageSize: number;
        };
        data: any[];
    }>;
    getPublicCategories(): Promise<{
        id: string;
        name: string;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getPublicBrands(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getPublicProduct(id: string): Promise<{
        id: string;
        name: string;
        description: string;
        brand: string;
        category: string;
        price: number;
        basePrice: number;
        inStock: boolean;
        availableQuantity: number;
        images: import(".prisma/client").Prisma.JsonValue;
        variants: {
            id: string;
            sku: string;
            size: string;
            color: string;
            stock: number;
        }[];
    }>;
    getPosSyncCatalog(branchId: string): Promise<{
        status: string;
        timestamp: string;
        data: {
            sku: string;
            barcode: string;
            name: string;
            basePrice: number;
        }[];
    }>;
    repriceUsd(usdType: 'Oficial' | 'Blue'): Promise<{
        success: boolean;
        updatedCount: number;
    }>;
}
