"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SyncEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncEngineService = void 0;
const common_1 = require("@nestjs/common");
const sync_operation_model_1 = require("./models/sync-operation.model");
const conflict_resolution_service_1 = require("./conflict-resolution.service");
const checkout_orchestrator_1 = require("../sales/checkout.orchestrator");
const returns_service_1 = require("../sales/returns/returns.service");
const cash_service_1 = require("../finance/cash/cash.service");
const audit_service_1 = require("../audit/audit.service");
const audit_log_model_1 = require("../audit/models/audit-log.model");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let SyncEngineService = SyncEngineService_1 = class SyncEngineService {
    constructor(prisma, conflictResolution, checkoutOrchestrator, returnsService, cashService, auditService) {
        this.prisma = prisma;
        this.conflictResolution = conflictResolution;
        this.checkoutOrchestrator = checkoutOrchestrator;
        this.returnsService = returnsService;
        this.cashService = cashService;
        this.auditService = auditService;
        this.logger = new common_1.Logger(SyncEngineService_1.name);
    }
    async processBatch(batch) {
        this.logger.log(`[Sync] Received batch ${batch.batchId} from device ${batch.deviceId} with ${batch.operations.length} operations`);
        const ordered = [...batch.operations].sort((a, b) => new Date(a.clientTimestamp).getTime() - new Date(b.clientTimestamp).getTime());
        const results = [];
        let applied = 0, conflicts = 0, rejected = 0;
        for (const op of ordered) {
            const result = await this.processSingleOperation(op);
            results.push(result);
            if (result.status === sync_operation_model_1.SyncStatus.APPLIED)
                applied++;
            else if (result.status === sync_operation_model_1.SyncStatus.CONFLICT)
                conflicts++;
            else if (result.status === sync_operation_model_1.SyncStatus.REJECTED)
                rejected++;
        }
        await this.auditService.log({
            userId: batch.operations[0]?.userId ?? 'pos-device',
            action: audit_log_model_1.AuditAction.CREATE,
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
    async getSyncLogs() {
        return this.prisma.offlineSyncLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async processSingleOperation(op) {
        const existing = await this.prisma.offlineSyncLog.findUnique({
            where: { clientGeneratedId: op.clientGeneratedId },
        });
        if (existing) {
            this.logger.log(`[Sync] Skipping duplicate operation ${op.clientGeneratedId} (already ${existing.status})`);
            return { clientGeneratedId: op.clientGeneratedId, status: existing.status, detail: 'Duplicate — already processed' };
        }
        await this.prisma.offlineSyncLog.create({
            data: {
                clientGeneratedId: op.clientGeneratedId,
                branchId: op.branchId,
                userId: op.userId,
                type: op.type,
                payload: op.payload || {},
                clientTimestamp: new Date(op.clientTimestamp),
                status: sync_operation_model_1.SyncStatus.PROCESSING,
                serverTimestamp: new Date(),
            },
        });
        try {
            let finalStatus = sync_operation_model_1.SyncStatus.APPLIED;
            let conflictDetails = null;
            switch (op.type) {
                case sync_operation_model_1.SyncOperationType.CHECKOUT:
                    const stockConflicts = await this.conflictResolution.detectCheckoutConflicts(op);
                    if (stockConflicts.length > 0) {
                        conflictDetails = stockConflicts[0];
                        finalStatus = sync_operation_model_1.SyncStatus.CONFLICT;
                        this.logger.warn(`[Sync] Checkout ${op.clientGeneratedId} has stock conflicts — applying with CLIENT_WINS strategy`);
                    }
                    await this.checkoutOrchestrator.processCheckout({
                        id: op.clientGeneratedId,
                        ...op.payload,
                        createdAtIso: op.clientTimestamp.toString(),
                    });
                    break;
                case sync_operation_model_1.SyncOperationType.RETURN:
                    await this.returnsService.processReturn(op.payload);
                    break;
                case sync_operation_model_1.SyncOperationType.CASH_MOVEMENT:
                    await this.cashService.recordExpense(op.payload.accountId, op.payload.amount, op.payload.description, op.userId);
                    break;
                case sync_operation_model_1.SyncOperationType.STOCK_COUNT:
                    const countConflicts = await this.conflictResolution.detectStockCountConflicts(op);
                    if (countConflicts.length > 0) {
                        finalStatus = sync_operation_model_1.SyncStatus.CONFLICT;
                        conflictDetails = countConflicts[0];
                        this.logger.warn(`[Sync] Stock count ${op.clientGeneratedId} requires MANAGER_REVIEW`);
                    }
                    else {
                        this.logger.log(`[Sync] Stock count ${op.clientGeneratedId} clean — applying adjustments`);
                    }
                    break;
                default:
                    throw new Error(`Unknown operation type: ${op.type}`);
            }
            await this.prisma.offlineSyncLog.update({
                where: { clientGeneratedId: op.clientGeneratedId },
                data: {
                    status: finalStatus,
                    conflictDetails: conflictDetails || undefined,
                    appliedAt: new Date(),
                },
            });
            return { clientGeneratedId: op.clientGeneratedId, status: finalStatus };
        }
        catch (err) {
            this.logger.error(`[Sync] Operation ${op.clientGeneratedId} REJECTED: ${err.message}`);
            await this.prisma.offlineSyncLog.update({
                where: { clientGeneratedId: op.clientGeneratedId },
                data: {
                    status: sync_operation_model_1.SyncStatus.REJECTED,
                    conflictDetails: { error: err.message },
                },
            });
            return { clientGeneratedId: op.clientGeneratedId, status: sync_operation_model_1.SyncStatus.REJECTED, detail: err.message };
        }
    }
};
exports.SyncEngineService = SyncEngineService;
exports.SyncEngineService = SyncEngineService = SyncEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        conflict_resolution_service_1.ConflictResolutionService,
        checkout_orchestrator_1.CheckoutOrchestrator,
        returns_service_1.ReturnsService,
        cash_service_1.CashService,
        audit_service_1.AuditService])
], SyncEngineService);
//# sourceMappingURL=sync-engine.service.js.map