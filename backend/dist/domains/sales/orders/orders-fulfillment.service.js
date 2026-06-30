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
exports.OrdersFulfillmentService = void 0;
const common_1 = require("@nestjs/common");
const fulfillment_model_1 = require("./models/fulfillment.model");
const sales_service_1 = require("../sales.service");
const stock_movement_service_1 = require("../../logistics/stock-movement.service");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let OrdersFulfillmentService = class OrdersFulfillmentService {
    constructor(salesService, stockService, prisma) {
        this.salesService = salesService;
        this.stockService = stockService;
        this.prisma = prisma;
    }
    async initializeFulfillment(saleOrderId) {
        return this.prisma.orderFulfillment.create({
            data: {
                id: crypto.randomUUID(),
                saleOrderId,
                status: fulfillment_model_1.OrderStatus.PENDING_PAYMENT,
            }
        });
    }
    async markAsPaid(id) {
        const fulfillment = await this.getFulfillment(id);
        if (fulfillment.status !== fulfillment_model_1.OrderStatus.PENDING_PAYMENT) {
            throw new common_1.BadRequestException('Order is not in a payable state.');
        }
        return this.prisma.orderFulfillment.update({
            where: { id },
            data: {
                status: fulfillment_model_1.OrderStatus.PAID,
                paidAt: new Date()
            }
        });
    }
    async startPicking(id) {
        const fulfillment = await this.getFulfillment(id);
        if (fulfillment.status !== fulfillment_model_1.OrderStatus.PAID)
            throw new common_1.BadRequestException('Order must be PAID before picking.');
        return this.prisma.orderFulfillment.update({
            where: { id },
            data: {
                status: fulfillment_model_1.OrderStatus.PICKING,
                pickedAt: new Date()
            }
        });
    }
    async markAsPacked(id) {
        const fulfillment = await this.getFulfillment(id);
        if (fulfillment.status !== fulfillment_model_1.OrderStatus.PICKING)
            throw new common_1.BadRequestException('Order must be PICKING before packed.');
        return this.prisma.orderFulfillment.update({
            where: { id },
            data: {
                status: fulfillment_model_1.OrderStatus.PACKED,
                packedAt: new Date()
            }
        });
    }
    async shipOrder(id, trackingNumber, courierName) {
        const fulfillment = await this.getFulfillment(id);
        if (fulfillment.status !== fulfillment_model_1.OrderStatus.PACKED)
            throw new common_1.BadRequestException('Order must be PACKED before shipping.');
        return this.prisma.orderFulfillment.update({
            where: { id },
            data: {
                status: fulfillment_model_1.OrderStatus.SHIPPED,
                trackingNumber,
                courierName,
                shippedAt: new Date()
            }
        });
    }
    async markAsDelivered(id) {
        const fulfillment = await this.getFulfillment(id);
        if (fulfillment.status !== fulfillment_model_1.OrderStatus.SHIPPED)
            throw new common_1.BadRequestException('Order must be SHIPPED before delivered.');
        return this.prisma.orderFulfillment.update({
            where: { id },
            data: {
                status: fulfillment_model_1.OrderStatus.DELIVERED,
                deliveredAt: new Date()
            }
        });
    }
    async getFulfillment(id) {
        const f = await this.prisma.orderFulfillment.findUnique({ where: { id } });
        if (!f)
            throw new common_1.NotFoundException('Fulfillment record not found');
        return f;
    }
};
exports.OrdersFulfillmentService = OrdersFulfillmentService;
exports.OrdersFulfillmentService = OrdersFulfillmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sales_service_1.SalesService,
        stock_movement_service_1.StockMovementService,
        prisma_service_1.PrismaService])
], OrdersFulfillmentService);
//# sourceMappingURL=orders-fulfillment.service.js.map