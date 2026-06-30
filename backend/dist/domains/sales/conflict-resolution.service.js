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
var ConflictResolutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictResolutionService = void 0;
const common_1 = require("@nestjs/common");
const sync_operation_model_1 = require("./models/sync-operation.model");
const inventory_service_1 = require("../logistics/inventory.service");
let ConflictResolutionService = ConflictResolutionService_1 = class ConflictResolutionService {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
        this.logger = new common_1.Logger(ConflictResolutionService_1.name);
    }
    async detectCheckoutConflicts(op) {
        const conflicts = [];
        for (const line of (op.payload.lines ?? [])) {
            const stockLevels = await this.inventoryService.getStockPerBranch(op.branchId, line.variantId);
            const serverAvailable = stockLevels.reduce((s, l) => s + l.availableQuantity, 0);
            if (serverAvailable < line.quantity) {
                conflicts.push({
                    field: `stock.${line.variantId}`,
                    clientValue: line.quantity,
                    serverValue: serverAvailable,
                    strategy: sync_operation_model_1.ConflictStrategy.CLIENT_WINS,
                });
                this.logger.warn(`[Conflict] Stock shortage on variantId=${line.variantId}. ` +
                    `Client sold ${line.quantity}, server only has ${serverAvailable}. Applying CLIENT_WINS.`);
            }
        }
        return conflicts;
    }
    async detectStockCountConflicts(op) {
        const conflicts = [];
        for (const countLine of (op.payload.counts ?? [])) {
            const stockLevels = await this.inventoryService.getStockPerBranch(op.branchId, countLine.variantId);
            const serverQty = stockLevels.reduce((s, l) => s + l.availableQuantity, 0);
            if (serverQty !== countLine.countedQuantity) {
                conflicts.push({
                    field: `count.${countLine.variantId}`,
                    clientValue: countLine.countedQuantity,
                    serverValue: serverQty,
                    strategy: sync_operation_model_1.ConflictStrategy.MANAGER_REVIEW,
                });
            }
        }
        return conflicts;
    }
};
exports.ConflictResolutionService = ConflictResolutionService;
exports.ConflictResolutionService = ConflictResolutionService = ConflictResolutionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], ConflictResolutionService);
//# sourceMappingURL=conflict-resolution.service.js.map