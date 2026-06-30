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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovementService = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const inventory_movement_model_1 = require("./models/inventory-movement.model");
let StockMovementService = class StockMovementService {
    constructor(inventoryLedger) {
        this.inventoryLedger = inventoryLedger;
    }
    async processGoodsReceipt(payload, tx) {
        const mockUnitCost = payload.purchaseCost;
        return this.inventoryLedger.recordMovement({
            variantId: payload.variantId,
            sourceWarehouseId: null,
            destinationWarehouseId: payload.destinationWarehouseId,
            branchId: payload.branchId,
            type: inventory_movement_model_1.MovementType.GOODS_RECEIPT,
            quantity: payload.quantity,
            unitCost: mockUnitCost,
            referenceId: payload.purchaseOrderId,
            batchId: payload.batchId,
        }, tx);
    }
    async processSaleExit(payload, tx) {
        if (payload.wasReserved) {
            await this.inventoryLedger.releaseReservation(payload.variantId, payload.sourceWarehouseId, payload.branchId, payload.quantity, payload.orderId, tx);
        }
        return this.inventoryLedger.recordMovement({
            variantId: payload.variantId,
            sourceWarehouseId: payload.sourceWarehouseId,
            destinationWarehouseId: null,
            branchId: payload.branchId,
            type: inventory_movement_model_1.MovementType.SALE,
            quantity: payload.quantity,
            referenceId: payload.orderId,
        }, tx);
    }
    async processAdjustment(payload, tx) {
        const currentStockArr = await this.inventoryLedger.getStockPerWarehouse(payload.warehouseId, payload.variantId);
        const currentStock = currentStockArr.length > 0 ? currentStockArr[0].physicalQuantity : 0;
        if (payload.countedQuantity === currentStock) {
            return { status: 'NO_CHANGE', message: 'Physical count matches system stock perfectly.' };
        }
        const difference = payload.countedQuantity - currentStock;
        if (difference < 0) {
            return this.inventoryLedger.recordMovement({
                variantId: payload.variantId,
                sourceWarehouseId: payload.warehouseId,
                destinationWarehouseId: null,
                branchId: payload.branchId,
                type: inventory_movement_model_1.MovementType.SHRINKAGE,
                quantity: Math.abs(difference),
                referenceId: `ADJ-${payload.userId}-${payload.reason}`,
            }, tx);
        }
        else {
            return this.inventoryLedger.recordMovement({
                variantId: payload.variantId,
                sourceWarehouseId: null,
                destinationWarehouseId: payload.warehouseId,
                branchId: payload.branchId,
                type: inventory_movement_model_1.MovementType.POS_CORRECTION,
                quantity: Math.abs(difference),
                referenceId: `ADJ-${payload.userId}-${payload.reason}`,
            }, tx);
        }
    }
    async processReservation(payload, tx) {
        return this.inventoryLedger.reserveStock(payload.variantId, payload.warehouseId, payload.branchId, payload.quantity, payload.orderId, tx);
    }
};
exports.StockMovementService = StockMovementService;
exports.StockMovementService = StockMovementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], StockMovementService);
//# sourceMappingURL=stock-movement.service.js.map