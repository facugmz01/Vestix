import { SyncBatch, SyncStatus } from './models/sync-operation.model';
import { ConflictResolutionService } from './conflict-resolution.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { ReturnsService } from '../sales/returns/returns.service';
import { CashService } from '../finance/cash/cash.service';
import { AuditService } from '../audit/audit.service';
export declare class SyncEngineService {
    private readonly conflictResolution;
    private readonly checkoutOrchestrator;
    private readonly returnsService;
    private readonly cashService;
    private readonly auditService;
    private readonly logger;
    private readonly syncLog;
    constructor(conflictResolution: ConflictResolutionService, checkoutOrchestrator: CheckoutOrchestrator, returnsService: ReturnsService, cashService: CashService, auditService: AuditService);
    processBatch(batch: SyncBatch): Promise<{
        batchId: string;
        total: number;
        applied: number;
        conflicts: number;
        rejected: number;
        results: {
            clientGeneratedId: string;
            status: SyncStatus;
            detail?: string;
        }[];
    }>;
    private processSingleOperation;
    private applyCheckout;
    private applyStockCount;
}
