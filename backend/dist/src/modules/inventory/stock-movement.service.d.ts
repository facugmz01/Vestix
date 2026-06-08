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
    }): Promise<any>;
    processSaleExit(payload: {
        variantId: string;
        sourceWarehouseId: string;
        branchId: string;
        quantity: number;
        orderId: string;
        wasReserved: boolean;
    }): Promise<any>;
    processAdjustment(payload: {
        variantId: string;
        warehouseId: string;
        branchId: string;
        countedQuantity: number;
        reason: string;
        userId: string;
    }): Promise<any>;
    processReservation(payload: {
        variantId: string;
        warehouseId: string;
        branchId: string;
        quantity: number;
        orderId: string;
    }): Promise<any>;
}
