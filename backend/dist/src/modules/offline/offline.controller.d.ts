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
}
