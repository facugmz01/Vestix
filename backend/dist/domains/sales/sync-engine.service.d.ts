import { SyncBatch, SyncStatus } from './models/sync-operation.model';
import { ConflictResolutionService } from './conflict-resolution.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { ReturnsService } from './returns/returns.service';
import { CashService } from '../finance/cash/cash.service';
import { AuditService } from '../../modules/audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';
export declare class SyncEngineService {
    private readonly prisma;
    private readonly conflictResolution;
    private readonly checkoutOrchestrator;
    private readonly returnsService;
    private readonly cashService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, conflictResolution: ConflictResolutionService, checkoutOrchestrator: CheckoutOrchestrator, returnsService: ReturnsService, cashService: CashService, auditService: AuditService);
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
    getSyncLogs(): Promise<{
        id: string;
        clientGeneratedId: string;
        branchId: string;
        userId: string;
        type: string;
        payload: import(".prisma/client").Prisma.JsonValue;
        clientTimestamp: Date;
        status: string;
        conflictDetails: import(".prisma/client").Prisma.JsonValue | null;
        appliedAt: Date | null;
        serverTimestamp: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    private processSingleOperation;
}
