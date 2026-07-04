import { CatalogService } from './catalog.service';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
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
    repriceUsd(dto: {
        type: 'Oficial' | 'Blue';
    }): Promise<{
        success: boolean;
        updatedCount: number;
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
}
