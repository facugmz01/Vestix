import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto } from './dto/purchasing.dto';
export declare class PurchasingController {
    private readonly purchasingService;
    constructor(purchasingService: PurchasingService);
    createPO(createPurchaseOrderDto: CreatePurchaseOrderDto): Promise<import("./models/purchase-order.model").PurchaseOrder>;
    issuePO(id: string): Promise<import("./models/purchase-order.model").PurchaseOrder>;
}
