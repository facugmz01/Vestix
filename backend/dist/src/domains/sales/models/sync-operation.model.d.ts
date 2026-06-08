export declare enum SyncOperationType {
    CHECKOUT = "CHECKOUT",
    RETURN = "RETURN",
    CASH_MOVEMENT = "CASH_MOVEMENT",
    STOCK_COUNT = "STOCK_COUNT"
}
export declare enum SyncStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    APPLIED = "APPLIED",
    CONFLICT = "CONFLICT",
    REJECTED = "REJECTED"
}
export declare enum ConflictStrategy {
    SERVER_WINS = "SERVER_WINS",
    CLIENT_WINS = "CLIENT_WINS",
    MANAGER_REVIEW = "MANAGER_REVIEW"
}
export interface SyncOperation {
    clientGeneratedId: string;
    branchId: string;
    userId: string;
    type: SyncOperationType;
    payload: Record<string, any>;
    clientTimestamp: Date;
    status: SyncStatus;
    conflictDetails?: ConflictDetail;
    appliedAt?: Date;
    serverTimestamp?: Date;
}
export interface ConflictDetail {
    field: string;
    clientValue: any;
    serverValue: any;
    strategy: ConflictStrategy;
    resolvedBy?: string;
    resolvedAt?: Date;
}
export interface SyncBatch {
    batchId: string;
    deviceId: string;
    branchId: string;
    operations: SyncOperation[];
    sentAt: Date;
}
