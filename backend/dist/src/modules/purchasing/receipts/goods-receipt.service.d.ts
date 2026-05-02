import { GoodsReceipt } from './models/goods-receipt.model';
import { PurchasingService } from '../purchasing.service';
import { StockMovementService } from '../../inventory/stock-movement.service';
export declare class GoodsReceiptService {
    private readonly purchasingService;
    private readonly stockMovementService;
    constructor(purchasingService: PurchasingService, stockMovementService: StockMovementService);
    private receipts;
    draftReceipt(payload: {
        purchaseOrderId: string;
        receivedByUserId: string;
        scannedItems: {
            poLineItemId: string;
            variantId: string;
            quantity: number;
        }[];
    }): Promise<GoodsReceipt>;
    validateReceipt(receiptId: string, approvedByUserId?: string): Promise<GoodsReceipt>;
}
