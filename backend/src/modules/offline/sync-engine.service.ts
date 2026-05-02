import { Injectable, Logger } from '@nestjs/common';
import {
  SyncBatch,
  SyncOperation,
  SyncOperationType,
  SyncStatus,
} from './models/sync-operation.model';
import { ConflictResolutionService } from './conflict-resolution.service';
import { CheckoutOrchestrator } from '../sales/checkout.orchestrator';
import { ReturnsService } from '../sales/returns/returns.service';
import { CashService } from '../finance/cash/cash.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';
import * as crypto from 'crypto';

@Injectable()
export class SyncEngineService {
  private readonly logger = new Logger(SyncEngineService.name);

  // Persisted sync log. In production: append-only PostgreSQL table.
  private readonly syncLog: SyncOperation[] = [];

  constructor(
    private readonly conflictResolution: ConflictResolutionService,
    private readonly checkoutOrchestrator: CheckoutOrchestrator,
    private readonly returnsService: ReturnsService,
    private readonly cashService: CashService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * PRIMARY SYNC ENDPOINT
   * The POS client calls POST /offline/sync with a batch of operations collected while offline.
   *
   * Critical guarantees:
   * 1. IDEMPOTENCY: Re-sending the same batch is completely safe. Already-applied operations are skipped.
   * 2. ORDERING: Operations are sorted by clientTimestamp before processing.
   * 3. PARTIAL SUCCESS: Even if 1 operation in a batch of 20 fails, the remaining 19 are still applied.
   */
  async processBatch(batch: SyncBatch): Promise<{
    batchId: string;
    total: number;
    applied: number;
    conflicts: number;
    rejected: number;
    results: { clientGeneratedId: string; status: SyncStatus; detail?: string }[];
  }> {
    this.logger.log(`[Sync] Received batch ${batch.batchId} from device ${batch.deviceId} with ${batch.operations.length} operations`);

    // 1. Sort by client timestamp to preserve cashier action ordering
    const ordered = [...batch.operations].sort(
      (a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime()
    );

    const results = [];
    let applied = 0, conflicts = 0, rejected = 0;

    for (const op of ordered) {
      const result = await this.processSingleOperation(op);
      results.push(result);

      if (result.status === SyncStatus.APPLIED) applied++;
      else if (result.status === SyncStatus.CONFLICT) conflicts++;
      else if (result.status === SyncStatus.REJECTED) rejected++;
    }

    await this.auditService.log({
      userId: batch.operations[0]?.userId ?? 'pos-device',
      action: AuditAction.CREATE,
      resource: 'SyncBatch',
      resourceId: batch.batchId,
      module: 'SyncEngineService',
      description: `Batch from device ${batch.deviceId}: ${applied} applied, ${conflicts} conflicts, ${rejected} rejected`,
    });

    return {
      batchId: batch.batchId,
      total: ordered.length,
      applied,
      conflicts,
      rejected,
      results,
    };
  }

  // ─── SINGLE OPERATION PROCESSOR ─────────────────────────────────────────────

  private async processSingleOperation(op: SyncOperation): Promise<{ clientGeneratedId: string; status: SyncStatus; detail?: string }> {
    // 1. IDEMPOTENCY CHECK: Has this exact operation been applied before?
    const existing = this.syncLog.find(l => l.clientGeneratedId === op.clientGeneratedId);
    if (existing) {
      this.logger.log(`[Sync] Skipping duplicate operation ${op.clientGeneratedId} (already ${existing.status})`);
      return { clientGeneratedId: op.clientGeneratedId, status: existing.status, detail: 'Duplicate — already processed' };
    }

    op.status = SyncStatus.PROCESSING;
    op.serverTimestamp = new Date();
    this.syncLog.push(op);

    try {
      switch (op.type) {
        case SyncOperationType.CHECKOUT:
          await this.applyCheckout(op);
          break;

        case SyncOperationType.RETURN:
          await this.returnsService.processReturn(op.payload as any);
          break;

        case SyncOperationType.CASH_MOVEMENT:
          await this.cashService.recordExpense(
            op.payload.accountId,
            op.payload.amount,
            op.payload.description,
            op.userId,
          );
          break;

        case SyncOperationType.STOCK_COUNT:
          await this.applyStockCount(op);
          break;

        default:
          throw new Error(`Unknown operation type: ${(op as any).type}`);
      }

      op.status = SyncStatus.APPLIED;
      op.appliedAt = new Date();
      return { clientGeneratedId: op.clientGeneratedId, status: SyncStatus.APPLIED };

    } catch (err: any) {
      op.status = SyncStatus.REJECTED;
      this.logger.error(`[Sync] Operation ${op.clientGeneratedId} REJECTED: ${err.message}`);
      return { clientGeneratedId: op.clientGeneratedId, status: SyncStatus.REJECTED, detail: err.message };
    }
  }

  // ─── OPERATION HANDLERS ──────────────────────────────────────────────────────

  private async applyCheckout(op: SyncOperation) {
    // Detect stock conflicts before applying
    const stockConflicts = await this.conflictResolution.detectCheckoutConflicts(op);

    if (stockConflicts.length > 0) {
      op.conflictDetails = stockConflicts[0]; // Log first conflict for audit
      op.status = SyncStatus.CONFLICT;
      // CLIENT_WINS for POS checkouts: apply the sale anyway, flag for manager
      this.logger.warn(`[Sync] Checkout ${op.clientGeneratedId} has stock conflicts — applying with CLIENT_WINS strategy`);
    }

    // Feed directly into the master Sales orchestrator using the POS-generated UUID as orderId
    await this.checkoutOrchestrator.processCheckout({
      id: op.clientGeneratedId, // This is the idempotency key
      ...op.payload,
      createdAtIso: op.clientTimestamp.toString(),
    } as any);
  }

  private async applyStockCount(op: SyncOperation) {
    const countConflicts = await this.conflictResolution.detectStockCountConflicts(op);

    if (countConflicts.length > 0) {
      // MANAGER_REVIEW: Do NOT auto-apply stock count changes if there is a discrepancy.
      // Store the conflict for manual resolution.
      op.status = SyncStatus.CONFLICT;
      op.conflictDetails = countConflicts[0];
      this.logger.warn(`[Sync] Stock count ${op.clientGeneratedId} requires MANAGER_REVIEW`);
      return;
    }

    // No conflict: apply the physical count as stock adjustments
    this.logger.log(`[Sync] Stock count ${op.clientGeneratedId} clean — applying adjustments`);
    // In production: fire ADJUSTMENT movements into the InventoryService ledger for each count line
  }
}
