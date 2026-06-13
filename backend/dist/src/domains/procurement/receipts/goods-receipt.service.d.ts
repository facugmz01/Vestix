import { PrismaService } from '../../../core/prisma/prisma.service';
import { PurchasingService } from '../purchasing.service';
import { StockMovementService } from '../../logistics/stock-movement.service';
export declare class GoodsReceiptService {
    private readonly prisma;
    private readonly purchasingService;
    private readonly stockMovementService;
    constructor(prisma: PrismaService, purchasingService: PurchasingService, stockMovementService: StockMovementService);
    findAll(query?: any): Promise<{
        data: ({
            lines: {
                id: string;
                receiptId: string;
                poLineItemId: string;
                variantId: string;
                expectedQuantity: number;
                receivedQuantity: number;
                difference: number;
                batchLot: string | null;
                batchExpirationDate: Date | null;
                notes: string | null;
            }[];
        } & {
            id: string;
            purchaseOrderId: string;
            destinationWarehouseId: string;
            receivedByUserId: string | null;
            status: string;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        lines: {
            id: string;
            receiptId: string;
            poLineItemId: string;
            variantId: string;
            expectedQuantity: number;
            receivedQuantity: number;
            difference: number;
            batchLot: string | null;
            batchExpirationDate: Date | null;
            notes: string | null;
        }[];
    } & {
        id: string;
        purchaseOrderId: string;
        destinationWarehouseId: string;
        receivedByUserId: string | null;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    draftReceipt(payload: {
        purchaseOrderId: string;
        receivedByUserId?: string;
        scannedItems: {
            poLineItemId: string;
            variantId: string;
            quantity: number;
            batchLot?: string;
            batchExpirationDate?: string;
        }[];
        notes?: string;
    }): Promise<{
        lines: {
            id: string;
            receiptId: string;
            poLineItemId: string;
            variantId: string;
            expectedQuantity: number;
            receivedQuantity: number;
            difference: number;
            batchLot: string | null;
            batchExpirationDate: Date | null;
            notes: string | null;
        }[];
    } & {
        id: string;
        purchaseOrderId: string;
        destinationWarehouseId: string;
        receivedByUserId: string | null;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateReceipt(receiptId: string, branchId: string, approvedByUserId?: string): Promise<{
        lines: {
            id: string;
            receiptId: string;
            poLineItemId: string;
            variantId: string;
            expectedQuantity: number;
            receivedQuantity: number;
            difference: number;
            batchLot: string | null;
            batchExpirationDate: Date | null;
            notes: string | null;
        }[];
    } & {
        id: string;
        purchaseOrderId: string;
        destinationWarehouseId: string;
        receivedByUserId: string | null;
        status: string;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
