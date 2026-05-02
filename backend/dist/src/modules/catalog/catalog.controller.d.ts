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
