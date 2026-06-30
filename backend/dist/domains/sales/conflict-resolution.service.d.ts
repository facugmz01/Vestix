import { SyncOperation, ConflictDetail } from './models/sync-operation.model';
import { InventoryService } from '../logistics/inventory.service';
export declare class ConflictResolutionService {
    private readonly inventoryService;
    private readonly logger;
    constructor(inventoryService: InventoryService);
    detectCheckoutConflicts(op: SyncOperation): Promise<ConflictDetail[]>;
    detectStockCountConflicts(op: SyncOperation): Promise<ConflictDetail[]>;
}
