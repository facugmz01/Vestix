import { GoodsReceiptService } from './goods-receipt.service';
export declare class ReceiptsController {
    private readonly receiptsService;
    constructor(receiptsService: GoodsReceiptService);
    findAll(query: any): Promise<{
        data: ({
            lines: {
                id: string;
                receiptId: string;
                poLineItemId: string;
                variantId: string;
                expectedQuantity: number;
                receivedQuantity: number;
                difference: number;
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
    draft(dto: any): Promise<{
        lines: {
            id: string;
            receiptId: string;
            poLineItemId: string;
            variantId: string;
            expectedQuantity: number;
            receivedQuantity: number;
            difference: number;
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
    validate(id: string, dto: {
        branchId: string;
        approvedByUserId?: string;
    }): Promise<{
        lines: {
            id: string;
            receiptId: string;
            poLineItemId: string;
            variantId: string;
            expectedQuantity: number;
            receivedQuantity: number;
            difference: number;
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
