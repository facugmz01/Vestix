import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { ProductsService } from '../products/services/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';
export declare class CatalogService {
    private readonly productsService;
    private readonly inventoryService;
    private readonly pricingService;
    constructor(productsService: ProductsService, inventoryService: InventoryService, pricingService: PricingService);
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
