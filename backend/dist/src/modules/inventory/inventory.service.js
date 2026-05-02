"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const inventory_movement_model_1 = require("./models/inventory-movement.model");
const crypto = __importStar(require("crypto"));
let InventoryService = class InventoryService {
    constructor() {
        this.movements = [];
        this.stockLevels = new Map();
    }
    async recordMovement(data) {
        if (data.quantity <= 0) {
            throw new common_1.BadRequestException('Movement quantity must be strictly positive.');
        }
        const movement = {
            id: crypto.randomUUID(),
            variantId: data.variantId,
            sourceWarehouseId: data.sourceWarehouseId,
            destinationWarehouseId: data.destinationWarehouseId,
            type: data.type,
            quantity: data.quantity,
            unitCost: data.unitCost || 0,
            referenceId: data.referenceId || null,
            createdAt: new Date(),
        };
        this.movements.push(movement);
        if (data.sourceWarehouseId) {
            this.processOutbound(data.variantId, data.sourceWarehouseId, data.type, data.quantity);
        }
        if (data.destinationWarehouseId) {
            this.processInbound(data.variantId, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
        }
        return movement;
    }
    async reserveStock(variantId, warehouseId, branchId, quantity, orderId) {
        const stock = this.getStock(variantId, warehouseId);
        if (!stock || stock.availableQuantity < quantity) {
            throw new common_1.BadRequestException(`Insufficient available stock for variant ${variantId}. Cannot fulfill online order.`);
        }
        return this.recordMovement({
            variantId,
            sourceWarehouseId: null,
            destinationWarehouseId: warehouseId,
            branchId,
            type: inventory_movement_model_1.MovementType.RESERVATION,
            quantity,
            referenceId: orderId
        });
    }
    async releaseReservation(variantId, warehouseId, branchId, quantity, orderId) {
        return this.recordMovement({
            variantId,
            sourceWarehouseId: warehouseId,
            destinationWarehouseId: null,
            branchId,
            type: inventory_movement_model_1.MovementType.RESERVATION_RELEASE,
            quantity,
            referenceId: orderId
        });
    }
    getStockPerBranch(branchId, variantId) {
        return Array.from(this.stockLevels.values()).filter(lvl => lvl.branchId === branchId && (!variantId || lvl.variantId === variantId));
    }
    getStockPerWarehouse(warehouseId, variantId) {
        return Array.from(this.stockLevels.values()).filter(lvl => lvl.warehouseId === warehouseId && (!variantId || lvl.variantId === variantId));
    }
    processInbound(variantId, warehouseId, branchId, type, quantity) {
        const key = `${variantId}_${warehouseId}`;
        if (!this.stockLevels.has(key)) {
            this.stockLevels.set(key, { variantId, warehouseId, branchId, physicalQuantity: 0, reservedQuantity: 0, availableQuantity: 0, updatedAt: new Date() });
        }
        const stock = this.stockLevels.get(key);
        if (type === inventory_movement_model_1.MovementType.RESERVATION) {
            stock.reservedQuantity += quantity;
            stock.availableQuantity -= quantity;
        }
        else {
            stock.physicalQuantity += quantity;
            stock.availableQuantity += quantity;
        }
        stock.updatedAt = new Date();
    }
    processOutbound(variantId, warehouseId, type, quantity) {
        const key = `${variantId}_${warehouseId}`;
        const stock = this.stockLevels.get(key);
        if (!stock)
            return;
        if (type === inventory_movement_model_1.MovementType.RESERVATION_RELEASE) {
            stock.reservedQuantity -= quantity;
            stock.availableQuantity += quantity;
        }
        else if (type === inventory_movement_model_1.MovementType.SALE) {
            stock.physicalQuantity -= quantity;
            stock.availableQuantity -= quantity;
        }
        else {
            stock.physicalQuantity -= quantity;
            stock.availableQuantity -= quantity;
        }
        stock.updatedAt = new Date();
    }
    getStock(variantId, warehouseId) {
        return this.stockLevels.get(`${variantId}_${warehouseId}`);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)()
], InventoryService);
//# sourceMappingURL=inventory.service.js.map