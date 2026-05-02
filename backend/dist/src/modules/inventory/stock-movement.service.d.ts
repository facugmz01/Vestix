import { InventoryService } from './inventory.service';
export declare class StockMovementService {
    private readonly inventoryLedger;
    constructor(inventoryLedger: InventoryService);
    processGoodsReceipt(payload: {
        variantId: string;
        destinationWarehouseId: string;
        branchId: string;
        quantity: number;
        purchaseCost: number;
        purchaseOrderId: string;
    }): Promise<{
        id: string;
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        type: string;
        quantity: number;
        unitCost: number;
        referenceId: string | null;
        createdAt: Date;
    }>;
    processSaleExit(payload: {
        variantId: string;
        sourceWarehouseId: string;
        branchId: string;
        quantity: number;
        orderId: string;
        wasReserved: boolean;
    }): Promise<{
        id: string;
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        type: string;
        quantity: number;
        unitCost: number;
        referenceId: string | null;
        createdAt: Date;
    }>;
    processAdjustment(payload: {
        variantId: string;
        warehouseId: string;
        branchId: string;
        countedQuantity: number;
        reason: string;
        userId: string;
    }): Promise<{
        id: string;
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        type: string;
        quantity: number;
        unitCost: number;
        referenceId: string | null;
        createdAt: Date;
    } | {
        status: string;
        message: string;
    }>;
    processReservation(payload: {
        variantId: string;
        warehouseId: string;
        branchId: string;
        quantity: number;
        orderId: string;
    }): Promise<{
        id: string;
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        type: string;
        quantity: number;
        unitCost: number;
        referenceId: string | null;
        createdAt: Date;
    }>;
}
