import { InventoryService } from './inventory.service';
import { TransfersService } from './transfers/transfers.service';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly transfersService;
    constructor(inventoryService: InventoryService, transfersService: TransfersService);
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
    adjustStock(body: any): Promise<any>;
    processStockAudit(body: {
        warehouseId: string;
        items: {
            variantId: string;
            batchId?: string;
            countedQuantity: number;
        }[];
    }): Promise<{
        success: boolean;
        adjustmentsMade: number;
    }>;
    getMovements(query: any): Promise<{
        variantSku: string;
        productName: string;
        sourceWarehouseName: string;
        destinationWarehouseName: string;
        warehouseName: string;
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
        variant: {
            product: {
                id: string;
                name: string;
                baseSku: string | null;
                description: string | null;
                categoryId: string;
                brandId: string | null;
                type: import(".prisma/client").$Enums.ProductType;
                isVariable: boolean;
                manageBatches: boolean;
                costPrice: number;
                isActive: boolean;
                isPublished: boolean;
                preferredSupplierId: string | null;
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
            attributes: import(".prisma/client").Prisma.JsonValue;
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
        id: string;
        variantId: string;
        batchId: string | null;
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
            variant: {
                product: {
                    id: string;
                    name: string;
                    baseSku: string | null;
                    description: string | null;
                    categoryId: string;
                    brandId: string | null;
                    type: import(".prisma/client").$Enums.ProductType;
                    isVariable: boolean;
                    manageBatches: boolean;
                    costPrice: number;
                    isActive: boolean;
                    isPublished: boolean;
                    preferredSupplierId: string | null;
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
                attributes: import(".prisma/client").Prisma.JsonValue;
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
            id: string;
            variantId: string;
            batchId: string | null;
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
    getTransfers(query: any): Promise<{
        data: {
            sourceWarehouseName: string;
            destinationWarehouseName: string;
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
            lines: ({
                variant: {
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
                };
            } & {
                id: string;
                transferId: string;
                variantId: string;
                quantity: number;
                receivedQuantity: number | null;
                createdAt: Date;
            })[];
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
            id: string;
            sourceWarehouseId: string;
            destinationWarehouseId: string;
            status: string;
            trackingNumber: string | null;
            notes: string | null;
            requestedByUserId: string | null;
            dispatchedAt: Date | null;
            receivedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    getTransfer(id: string): Promise<{
        sourceWarehouseName: string;
        destinationWarehouseName: string;
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
        lines: ({
            variant: {
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
            };
        } & {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        })[];
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
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createTransfer(body: any): Promise<{
        lines: ({
            variant: {
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
            };
        } & {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        })[];
    } & {
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    dispatchTransfer(id: string, body: any): Promise<{
        lines: ({
            variant: {
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
            };
        } & {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        })[];
    } & {
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    receiveTransfer(id: string, body: any): Promise<{
        lines: ({
            variant: {
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
            };
        } & {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        })[];
    } & {
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelTransfer(id: string): Promise<{
        id: string;
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        status: string;
        trackingNumber: string | null;
        notes: string | null;
        requestedByUserId: string | null;
        dispatchedAt: Date | null;
        receivedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getReservations(page: string, pageSize: string): {
        data: any[];
        total: number;
    };
}
