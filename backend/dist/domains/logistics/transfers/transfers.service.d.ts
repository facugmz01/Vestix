import { PrismaService } from '../../../core/prisma/prisma.service';
import { InventoryService } from '../inventory.service';
import { TransferLine } from './models/transfer.model';
export declare class TransfersService {
    private readonly prisma;
    private readonly inventoryLedger;
    constructor(prisma: PrismaService, inventoryLedger: InventoryService);
    createTransfer(data: {
        sourceWarehouseId: string;
        destinationWarehouseId: string;
        lines: TransferLine[];
    }): Promise<{
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
    dispatchTransfer(transferId: string, options?: {
        trackingNumber?: string;
    }): Promise<{
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
    receiveTransfer(transferId: string, data: {
        lines: {
            variantId: string;
            receivedQuantity: number;
        }[];
    }): Promise<{
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
    cancelTransfer(transferId: string): Promise<{
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
    findAll(query: {
        page?: number;
        pageSize?: number;
        status?: string;
        search?: string;
    }): Promise<{
        data: any[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
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
}
