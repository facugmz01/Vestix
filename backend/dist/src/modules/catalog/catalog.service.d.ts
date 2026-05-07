import { CatalogFilterDto } from './dto/catalog-filter.dto';
import { ProductsService } from '../products/services/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class CatalogService {
    private readonly prisma;
    private readonly productsService;
    private readonly inventoryService;
    private readonly pricingService;
    constructor(prisma: PrismaService, productsService: ProductsService, inventoryService: InventoryService, pricingService: PricingService);
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
