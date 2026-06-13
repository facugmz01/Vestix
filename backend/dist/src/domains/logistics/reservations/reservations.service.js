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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const reservation_model_1 = require("./models/reservation.model");
const stock_movement_service_1 = require("../stock-movement.service");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let ReservationsService = class ReservationsService {
    constructor(stockService, prisma) {
        this.stockService = stockService;
        this.prisma = prisma;
    }
    async createReservation(payload) {
        const existing = await this.prisma.cartHold.findFirst({
            where: { id: payload.cartId, status: reservation_model_1.ReservationStatus.ACTIVE }
        });
        if (existing)
            throw new common_1.BadRequestException('An active reservation already exists for this cart.');
        for (const line of payload.lines) {
            await this.stockService.processReservation({
                variantId: line.variantId,
                warehouseId: payload.warehouseId,
                branchId: payload.branchId,
                quantity: line.quantity,
                orderId: `CART-${payload.cartId}`
            });
        }
        const ttl = payload.ttlMinutes || 15;
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + ttl);
        const reservation = await this.prisma.cartHold.create({
            data: {
                id: payload.cartId,
                warehouseId: payload.warehouseId,
                branchId: payload.branchId,
                customerId: payload.customerId,
                lines: payload.lines,
                status: reservation_model_1.ReservationStatus.ACTIVE,
                expiresAt,
            }
        });
        return reservation;
    }
    async completeReservation(cartId) {
        const reservation = await this.prisma.cartHold.findUnique({ where: { id: cartId } });
        if (!reservation)
            throw new common_1.NotFoundException('Reservation tracking not found');
        return this.prisma.cartHold.update({
            where: { id: cartId },
            data: { status: reservation_model_1.ReservationStatus.COMPLETED }
        });
    }
    async cancelReservation(cartId) {
        const reservation = await this.prisma.cartHold.findUnique({ where: { id: cartId } });
        if (!reservation)
            throw new common_1.NotFoundException('Reservation not found');
        if (reservation.status !== reservation_model_1.ReservationStatus.ACTIVE) {
            throw new common_1.BadRequestException('Only active reservations can be explicitly cancelled.');
        }
        const lines = reservation.lines;
        for (const line of lines) {
            await this.stockService['inventoryLedger'].releaseReservation(line.variantId, reservation.warehouseId, reservation.branchId, line.quantity, `CART-${cartId}`);
        }
        return this.prisma.cartHold.update({
            where: { id: cartId },
            data: { status: reservation_model_1.ReservationStatus.CANCELLED }
        });
    }
    async sweepExpiredReservations() {
        const now = new Date();
        const expiredHolds = await this.prisma.cartHold.findMany({
            where: { status: reservation_model_1.ReservationStatus.ACTIVE, expiresAt: { lt: now } }
        });
        let releasedCount = 0;
        for (const hold of expiredHolds) {
            const lines = hold.lines;
            for (const line of lines) {
                await this.stockService['inventoryLedger'].releaseReservation(line.variantId, hold.warehouseId, hold.branchId, line.quantity, `CART-${hold.id}`);
            }
            await this.prisma.cartHold.update({
                where: { id: hold.id },
                data: { status: reservation_model_1.ReservationStatus.EXPIRED }
            });
            releasedCount++;
        }
        return { sweptCount: releasedCount };
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stock_movement_service_1.StockMovementService,
        prisma_service_1.PrismaService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map