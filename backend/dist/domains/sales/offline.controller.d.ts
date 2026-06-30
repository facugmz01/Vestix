import { SyncEngineService } from './sync-engine.service';
import { SyncBatch } from './models/sync-operation.model';
export declare class OfflineController {
    private readonly syncEngine;
    constructor(syncEngine: SyncEngineService);
    processBatch(batch: SyncBatch): Promise<{
        batchId: string;
        total: number;
        applied: number;
        conflicts: number;
        rejected: number;
        results: {
            clientGeneratedId: string;
            status: import("./models/sync-operation.model").SyncStatus;
            detail?: string;
        }[];
    }>;
    getLogs(): Promise<{
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
}
