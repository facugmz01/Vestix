import { PrismaService } from '../../core/prisma/prisma.service';
export declare class InventoryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordMovement(data: {
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        branchId: string | null;
        type: string;
        quantity: number;
        unitCost?: number;
        referenceId?: string;
    }, tx?: any): Promise<any>;
    private updateStock;
    reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any): Promise<any>;
    releaseReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any): Promise<any>;
    consumeReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any): Promise<any>;
    getStockPerBranch(branchId: string, variantId?: string): Promise<{
        id: string;
        variantId: string;
        warehouseId: string;
        branchId: string | null;
        physicalQuantity: number;
        reservedQuantity: number;
        availableQuantity: number;
        updatedAt: Date;
    }[]>;
    getStockPerWarehouse(warehouseId: string, variantId?: string): Promise<{
        id: string;
        variantId: string;
        warehouseId: string;
        branchId: string | null;
        physicalQuantity: number;
        reservedQuantity: number;
        availableQuantity: number;
        updatedAt: Date;
    }[]>;
    adjustStock(dto: {
        variantId: string;
        warehouseId: string;
        quantity: number;
        type: 'ADD' | 'SUBTRACT' | 'SET';
        reason: string;
    }): Promise<any>;
    findAllStock(query?: any): Promise<{
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
    findAllMovements(query?: any): Promise<{
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
}
