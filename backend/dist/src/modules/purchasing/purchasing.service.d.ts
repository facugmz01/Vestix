import { PurchaseOrder } from './models/purchase-order.model';
import { CreatePurchaseOrderDto } from './dto/purchasing.dto';
import { StockMovementService } from '../inventory/stock-movement.service';
export declare class PurchasingService {
    private readonly stockMovementService;
    constructor(stockMovementService: StockMovementService);
    private purchaseOrders;
    createPO(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder>;
    issuePO(id: string): Promise<PurchaseOrder>;
    getPO(id: string): Promise<PurchaseOrder>;
    applyReceiptToPO(poId: string, receiptLines: {
        poLineItemId: string;
        receivedQuantity: number;
    }[]): Promise<void>;
}
