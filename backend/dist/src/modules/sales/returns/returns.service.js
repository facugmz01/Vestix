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
exports.ReturnsService = void 0;
const common_1 = require("@nestjs/common");
const return_model_1 = require("./models/return.model");
const stock_movement_service_1 = require("../../inventory/stock-movement.service");
const accounts_service_1 = require("../../finance/accounts.service");
const customers_service_1 = require("../../customers/customers.service");
const inventory_movement_model_1 = require("../../inventory/models/inventory-movement.model");
const crypto = __importStar(require("crypto"));
let ReturnsService = class ReturnsService {
    constructor(stockService, accountsService, customersService) {
        this.stockService = stockService;
        this.accountsService = accountsService;
        this.customersService = customersService;
        this.returns = [];
    }
    async processReturn(payload) {
        let totalRefund = 0;
        const returnLines = [];
        for (const line of payload.lines) {
            if (line.quantity <= 0)
                throw new common_1.BadRequestException('Return quantity must be positive.');
            totalRefund += line.refundAmount;
            returnLines.push({ id: crypto.randomUUID(), ...line });
            if (line.condition === return_model_1.ReturnCondition.SELLABLE) {
                await this.stockService['inventoryLedger'].recordMovement({
                    variantId: line.variantId,
                    sourceWarehouseId: null,
                    destinationWarehouseId: payload.warehouseId,
                    branchId: payload.branchId,
                    type: inventory_movement_model_1.MovementType.RETURN,
                    quantity: line.quantity,
                    referenceId: `RET-${payload.originalOrderId}`
                });
            }
            else if (line.condition === return_model_1.ReturnCondition.DAMAGED) {
                await this.stockService['inventoryLedger'].recordMovement({
                    variantId: line.variantId,
                    sourceWarehouseId: payload.warehouseId,
                    destinationWarehouseId: null,
                    branchId: payload.branchId,
                    type: inventory_movement_model_1.MovementType.SHRINKAGE,
                    quantity: line.quantity,
                    referenceId: `RET-DAMAGED-${payload.originalOrderId}`
                });
            }
            if (line.action === return_model_1.ReturnAction.EXCHANGE) {
                if (!line.exchangeVariantId)
                    throw new common_1.BadRequestException('Exchange requires a target Variant ID.');
                await this.stockService.processSaleExit({
                    variantId: line.exchangeVariantId,
                    sourceWarehouseId: payload.warehouseId,
                    branchId: payload.branchId,
                    quantity: line.quantity,
                    orderId: `EXC-${payload.originalOrderId}`,
                    wasReserved: false
                });
            }
        }
        if (totalRefund > 0) {
            const isStoreCredit = payload.lines.some(l => l.action === return_model_1.ReturnAction.STORE_CREDIT);
            if (isStoreCredit) {
                if (!payload.customerId)
                    throw new common_1.BadRequestException('Store credit requires a registered Customer Profile.');
                await this.customersService.repayCredit(payload.customerId, totalRefund, `CREDIT-${payload.originalOrderId}`);
            }
            else {
                if (!payload.refundAccountId)
                    throw new common_1.BadRequestException('Treasury Account ID required for cash/card refunds.');
                await this.accountsService.processOutgoingPayment({
                    accountId: payload.refundAccountId,
                    amount: totalRefund,
                    payeeName: payload.customerId || 'Walk-in Customer',
                    referenceId: `REF-${payload.originalOrderId}`,
                    description: `Refund for Order ${payload.originalOrderId}`
                });
            }
        }
        const saleReturn = {
            id: crypto.randomUUID(),
            originalOrderId: payload.originalOrderId,
            branchId: payload.branchId,
            warehouseId: payload.warehouseId,
            customerId: payload.customerId,
            lines: returnLines,
            totalRefundAmount: totalRefund,
            refundAccountId: payload.refundAccountId,
            createdAt: new Date(),
        };
        this.returns.push(saleReturn);
        return saleReturn;
    }
};
exports.ReturnsService = ReturnsService;
exports.ReturnsService = ReturnsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stock_movement_service_1.StockMovementService,
        accounts_service_1.AccountsService,
        customers_service_1.CustomersService])
], ReturnsService);
//# sourceMappingURL=returns.service.js.map