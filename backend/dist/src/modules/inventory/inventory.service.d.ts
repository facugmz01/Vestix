import { InventoryMovement, MovementType } from './models/inventory-movement.model';
import { StockLevel } from './models/stock-level.model';
export declare class InventoryService {
    private movements;
    private stockLevels;
    recordMovement(data: {
        variantId: string;
        sourceWarehouseId: string | null;
        destinationWarehouseId: string | null;
        branchId: string | null;
        type: MovementType;
        quantity: number;
        unitCost?: number;
        referenceId?: string;
    }): Promise<InventoryMovement>;
    reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string): Promise<InventoryMovement>;
    releaseReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string): Promise<InventoryMovement>;
    getStockPerBranch(branchId: string, variantId?: string): StockLevel[];
    getStockPerWarehouse(warehouseId: string, variantId?: string): StockLevel[];
    private processInbound;
    private processOutbound;
    private getStock;
}
