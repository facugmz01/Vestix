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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasingService = void 0;
const common_1 = require("@nestjs/common");
const purchase_order_model_1 = require("./models/purchase-order.model");
const stock_movement_service_1 = require("../inventory/stock-movement.service");
const crypto = __importStar(require("crypto"));
let PurchasingService = class PurchasingService {
    constructor(stockMovementService) {
        this.stockMovementService = stockMovementService;
        this.purchaseOrders = [];
    }
    async createPO(dto) {
        const lines = dto.lines.map(l => ({
            id: crypto.randomUUID(),
            variantId: l.variantId,
            orderedQuantity: l.orderedQuantity,
            receivedQuantity: 0,
            unitCost: l.unitCost,
        }));
        const totalCost = lines.reduce((sum, line) => sum + (line.orderedQuantity * line.unitCost), 0);
        const po = {
            id: crypto.randomUUID(),
            supplierId: dto.supplierId,
            destinationWarehouseId: dto.destinationWarehouseId,
            status: purchase_order_model_1.POStatus.DRAFT,
            lines,
            totalCost,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.purchaseOrders.push(po);
        return po;
    }
    async issuePO(id) {
        const po = this.purchaseOrders.find(p => p.id === id);
        if (!po)
            throw new common_1.NotFoundException('PO not found');
        po.status = purchase_order_model_1.POStatus.ISSUED;
        return po;
    }
    async getPO(id) {
        return this.purchaseOrders.find(p => p.id === id);
    }
    async applyReceiptToPO(poId, receiptLines) {
        const po = this.purchaseOrders.find(p => p.id === poId);
        if (!po)
            return;
        for (const receipt of receiptLines) {
            const line = po.lines.find(l => l.id === receipt.poLineItemId);
            if (line) {
                line.receivedQuantity += receipt.receivedQuantity;
            }
        }
        const allFullyReceived = po.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
        po.status = allFullyReceived ? purchase_order_model_1.POStatus.COMPLETED : purchase_order_model_1.POStatus.PARTIALLY_RECEIVED;
        if (allFullyReceived)
            po.completedAt = new Date();
        po.updatedAt = new Date();
    }
};
exports.PurchasingService = PurchasingService;
exports.PurchasingService = PurchasingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stock_movement_service_1.StockMovementService])
], PurchasingService);
//# sourceMappingURL=purchasing.service.js.map