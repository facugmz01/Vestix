import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
export declare class InventoryService {
    private readonly prisma;
    private readonly settingsService;
    constructor(prisma: PrismaService, settingsService: SettingsService);
    recordMovement(data: {
        variantId: string;
        batchId?: string | null;
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
        batchId: string | null;
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
        batchId: string | null;
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
    processStockAudit(data: {
        warehouseId: string;
        items: {
            variantId?: string;
            sku?: string;
            batchId?: string;
            countedQuantity: number;
        }[];
    }): Promise<{
        success: boolean;
        adjustmentsMade: number;
    }>;
}
