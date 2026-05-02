import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    getStockLevels(query: any): Promise<{
        data: {
            id: string;
            variantId: string;
            warehouseId: string;
            branchId: string;
            physicalQuantity: number;
            reservedQuantity: number;
            availableQuantity: number;
            variantSku: string;
            productName: string;
            warehouseName: string;
            branchName: string;
            lastUpdated: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    adjustStock(dto: any): Promise<{
        id: string;
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        type: string;
        quantity: number;
        unitCost: number;
        referenceId: string | null;
        createdAt: Date;
    } | ({
        warehouse: {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        variantId: string;
        warehouseId: string;
        branchId: string | null;
        physicalQuantity: number;
        reservedQuantity: number;
        availableQuantity: number;
        updatedAt: Date;
    })>;
    getMovements(query: any): Promise<{
        variantSku: string;
        productName: string;
        sourceWarehouseName: string;
        destinationWarehouseName: string;
        warehouseName: string;
        variant: {
            product: {
                id: string;
                name: string;
                baseSku: string | null;
                description: string | null;
                categoryId: string;
                brandId: string | null;
                isVariable: boolean;
                costPrice: number;
                isActive: boolean;
                isPublished: boolean;
                images: import(".prisma/client").Prisma.JsonValue;
                metadata: import(".prisma/client").Prisma.JsonValue;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
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
            createdAt: Date;
            updatedAt: Date;
        };
        sourceWarehouse: {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        destinationWarehouse: {
            id: string;
            name: string;
            code: string | null;
            type: string | null;
            address: string | null;
            isActive: boolean;
            branchId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        id: string;
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        type: string;
        quantity: number;
        unitCost: number;
        referenceId: string | null;
        createdAt: Date;
    }[]>;
    getAllMovements(query: any): Promise<{
        data: {
            variantSku: string;
            productName: string;
            sourceWarehouseName: string;
            destinationWarehouseName: string;
            warehouseName: string;
            variant: {
                product: {
                    id: string;
                    name: string;
                    baseSku: string | null;
                    description: string | null;
                    categoryId: string;
                    brandId: string | null;
                    isVariable: boolean;
                    costPrice: number;
                    isActive: boolean;
                    isPublished: boolean;
                    images: import(".prisma/client").Prisma.JsonValue;
                    metadata: import(".prisma/client").Prisma.JsonValue;
                    createdAt: Date;
                    updatedAt: Date;
                };
            } & {
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
                createdAt: Date;
                updatedAt: Date;
            };
            sourceWarehouse: {
                id: string;
                name: string;
                code: string | null;
                type: string | null;
                address: string | null;
                isActive: boolean;
                branchId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            destinationWarehouse: {
                id: string;
                name: string;
                code: string | null;
                type: string | null;
                address: string | null;
                isActive: boolean;
                branchId: string;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            variantId: string;
            sourceWarehouseId: string | null;
            destinationWarehouseId: string | null;
            type: string;
            quantity: number;
            unitCost: number;
            referenceId: string | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getTransfers(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
    getReservations(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
}
