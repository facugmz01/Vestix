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
exports.GoodsReceiptService = void 0;
const common_1 = require("@nestjs/common");
const goods_receipt_model_1 = require("./models/goods-receipt.model");
const purchasing_service_1 = require("../purchasing.service");
const stock_movement_service_1 = require("../../inventory/stock-movement.service");
const crypto = __importStar(require("crypto"));
let GoodsReceiptService = class GoodsReceiptService {
    constructor(purchasingService, stockMovementService) {
        this.purchasingService = purchasingService;
        this.stockMovementService = stockMovementService;
        this.receipts = [];
    }
    async draftReceipt(payload) {
        const po = await this.purchasingService.getPO(payload.purchaseOrderId);
        if (!po)
            throw new common_1.NotFoundException('Purchase Order not found');
        const lines = [];
        let hasDifferences = false;
        for (const scan of payload.scannedItems) {
            const poLine = po.lines.find(l => l.id === scan.poLineItemId);
            if (!poLine)
                throw new common_1.BadRequestException(`Line item ${scan.poLineItemId} does not belong to PO ${po.id}`);
            const expected = poLine.orderedQuantity - poLine.receivedQuantity;
            const difference = scan.quantity - expected;
            if (difference !== 0) {
                hasDifferences = true;
            }
            lines.push({
                id: crypto.randomUUID(),
                poLineItemId: scan.poLineItemId,
                variantId: scan.variantId,
                expectedQuantity: expected,
                receivedQuantity: scan.quantity,
                difference,
                notes: difference > 0 ? 'Overshipment' : (difference < 0 ? 'Short shipment' : undefined),
            });
        }
        const receipt = {
            id: crypto.randomUUID(),
            purchaseOrderId: po.id,
            destinationWarehouseId: po.destinationWarehouseId,
            receivedByUserId: payload.receivedByUserId,
            status: hasDifferences ? goods_receipt_model_1.ReceiptStatus.DISPUTED : goods_receipt_model_1.ReceiptStatus.DRAFT,
            lines,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.receipts.push(receipt);
        return receipt;
    }
    async validateReceipt(receiptId, approvedByUserId) {
        const receipt = this.receipts.find(r => r.id === receiptId);
        if (!receipt)
            throw new common_1.NotFoundException('Goods Receipt not found');
        if (receipt.status === goods_receipt_model_1.ReceiptStatus.VALIDATED) {
            throw new common_1.ConflictException('This receipt has already been validated and posted to the ledger.');
        }
        if (receipt.status === goods_receipt_model_1.ReceiptStatus.DISPUTED && !approvedByUserId) {
            throw new common_1.BadRequestException('This receipt contains differences. A manager must explicitly approve the validation.');
        }
        const po = await this.purchasingService.getPO(receipt.purchaseOrderId);
        for (const line of receipt.lines) {
            const poLine = po.lines.find(l => l.id === line.poLineItemId);
            await this.stockMovementService.processGoodsReceipt({
                variantId: line.variantId,
                destinationWarehouseId: receipt.destinationWarehouseId,
                branchId: 'DERIVED-FROM-WAREHOUSE-ID',
                quantity: line.receivedQuantity,
                purchaseCost: poLine.unitCost,
                purchaseOrderId: po.id,
            });
        }
        await this.purchasingService.applyReceiptToPO(receipt.purchaseOrderId, receipt.lines);
        receipt.status = goods_receipt_model_1.ReceiptStatus.VALIDATED;
        receipt.updatedAt = new Date();
        return receipt;
    }
};
exports.GoodsReceiptService = GoodsReceiptService;
exports.GoodsReceiptService = GoodsReceiptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [purchasing_service_1.PurchasingService,
        stock_movement_service_1.StockMovementService])
], GoodsReceiptService);
//# sourceMappingURL=goods-receipt.service.js.map