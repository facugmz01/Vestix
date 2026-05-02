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
    }): Promise<import("./models/inventory-movement.model").InventoryMovement>;
    processSaleExit(payload: {
        variantId: string;
        sourceWarehouseId: string;
        branchId: string;
        quantity: number;
        orderId: string;
        wasReserved: boolean;
    }): Promise<import("./models/inventory-movement.model").InventoryMovement>;
    processAdjustment(payload: {
        variantId: string;
        warehouseId: string;
        branchId: string;
        countedQuantity: number;
        reason: string;
        userId: string;
    }): Promise<import("./models/inventory-movement.model").InventoryMovement | {
        status: string;
        message: string;
    }>;
    processReservation(payload: {
        variantId: string;
        warehouseId: string;
        branchId: string;
        quantity: number;
        orderId: string;
    }): Promise<import("./models/inventory-movement.model").InventoryMovement>;
}
