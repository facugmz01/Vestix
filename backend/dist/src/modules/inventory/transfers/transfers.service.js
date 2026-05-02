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
exports.TransfersService = void 0;
const common_1 = require("@nestjs/common");
const transfer_model_1 = require("./models/transfer.model");
const inventory_service_1 = require("../inventory.service");
const inventory_movement_model_1 = require("../models/inventory-movement.model");
const crypto = __importStar(require("crypto"));
let TransfersService = class TransfersService {
    constructor(inventoryLedger) {
        this.inventoryLedger = inventoryLedger;
        this.transfers = [];
    }
    async createTransfer(data) {
        if (data.sourceWarehouseId === data.destinationWarehouseId) {
            throw new common_1.BadRequestException('Source and destination warehouses must be distinct.');
        }
        for (const line of data.lines) {
            const stockArr = await this.inventoryLedger.getStockPerWarehouse(data.sourceWarehouseId, line.variantId);
            const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
            if (available < line.quantity) {
                throw new common_1.BadRequestException(`Insufficient available stock for variant ${line.variantId} in the source warehouse.`);
            }
        }
        const transfer = {
            id: crypto.randomUUID(),
            sourceWarehouseId: data.sourceWarehouseId,
            destinationWarehouseId: data.destinationWarehouseId,
            status: transfer_model_1.TransferStatus.DRAFT,
            lines: data.lines,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.transfers.push(transfer);
        return transfer;
    }
    async dispatchTransfer(transferId, trackingNumber) {
        const transfer = this.transfers.find(t => t.id === transferId);
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== transfer_model_1.TransferStatus.DRAFT) {
            throw new common_1.BadRequestException('Only DRAFT transfers can be dispatched.');
        }
        for (const line of transfer.lines) {
            const stockArr = await this.inventoryLedger.getStockPerWarehouse(transfer.sourceWarehouseId, line.variantId);
            const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
            if (available < line.quantity) {
                throw new common_1.BadRequestException(`Dispatch Failed: Stock for variant ${line.variantId} was consumed by a sale before dispatch.`);
            }
            await this.inventoryLedger.recordMovement({
                variantId: line.variantId,
                sourceWarehouseId: transfer.sourceWarehouseId,
                destinationWarehouseId: null,
                branchId: null,
                type: inventory_movement_model_1.MovementType.TRANSFER_OUT,
                quantity: line.quantity,
                referenceId: `TRF-${transfer.id}`,
            });
        }
        transfer.status = transfer_model_1.TransferStatus.IN_TRANSIT;
        transfer.trackingNumber = trackingNumber;
        transfer.dispatchedAt = new Date();
        transfer.updatedAt = new Date();
        return transfer;
    }
    async receiveTransfer(transferId, destinationBranchId) {
        const transfer = this.transfers.find(t => t.id === transferId);
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== transfer_model_1.TransferStatus.IN_TRANSIT) {
            throw new common_1.BadRequestException('Only IN_TRANSIT transfers can be received.');
        }
        for (const line of transfer.lines) {
            await this.inventoryLedger.recordMovement({
                variantId: line.variantId,
                sourceWarehouseId: null,
                destinationWarehouseId: transfer.destinationWarehouseId,
                branchId: destinationBranchId,
                type: inventory_movement_model_1.MovementType.TRANSFER_IN,
                quantity: line.quantity,
                referenceId: `TRF-${transfer.id}`,
            });
        }
        transfer.status = transfer_model_1.TransferStatus.COMPLETED;
        transfer.receivedAt = new Date();
        transfer.updatedAt = new Date();
        return transfer;
    }
    async cancelTransfer(transferId) {
        const transfer = this.transfers.find(t => t.id === transferId);
        if (!transfer)
            throw new common_1.NotFoundException('Transfer not found');
        if (transfer.status !== transfer_model_1.TransferStatus.DRAFT) {
            throw new common_1.BadRequestException('Cannot cancel a transfer that is already dispatched. File a return or shrinkage instead.');
        }
        transfer.status = transfer_model_1.TransferStatus.CANCELLED;
        transfer.updatedAt = new Date();
        return transfer;
    }
};
exports.TransfersService = TransfersService;
exports.TransfersService = TransfersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], TransfersService);
//# sourceMappingURL=transfers.service.js.map