import { CatalogService } from './catalog.service';
import { CatalogFilterDto } from './dto/catalog-filter.dto';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    getPublicCatalog(filters: CatalogFilterDto): Promise<{
        metadata: {
            total: number;
            filtered: boolean;
        };
        data: any[];
    }>;
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
}
