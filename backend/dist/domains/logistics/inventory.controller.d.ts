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
        data: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getTransfer(id: string): Promise<{
        sourceWarehouseName: string;
        destinationWarehouseName: string;
        lines: any[];
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
        lines: {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        }[];
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
        lines: {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        }[];
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
        lines: {
            id: string;
            transferId: string;
            variantId: string;
            quantity: number;
            receivedQuantity: number | null;
            createdAt: Date;
        }[];
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
