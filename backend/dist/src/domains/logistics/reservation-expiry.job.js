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
var ReservationExpiryJob_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationExpiryJob = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const RESERVATION_EXPIRY_STATUS = 'ACTIVE';
const RESERVATION_EXPIRED_STATUS = 'EXPIRED';
const CANCELLATION_UNIT_COST = 0;
let ReservationExpiryJob = ReservationExpiryJob_1 = class ReservationExpiryJob {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReservationExpiryJob_1.name);
    }
    async releaseExpiredReservations() {
        const now = new Date();
        this.logger.log(`[ReservationExpiry] Running cleanup at ${now.toISOString()}`);
        const expired = await this.prisma.stockReservation.findMany({
            where: {
                status: RESERVATION_EXPIRY_STATUS,
                expiresAt: { lt: now },
            },
            take: 500,
        });
        if (expired.length === 0) {
            this.logger.log('[ReservationExpiry] No expired reservations found. Exiting.');
            return;
        }
        this.logger.warn(`[ReservationExpiry] Found ${expired.length} expired reservation(s). Releasing...`);
        let successCount = 0;
        let failureCount = 0;
        for (const reservation of expired) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    await tx.stockReservation.update({
                        where: { id: reservation.id },
                        data: { status: RESERVATION_EXPIRED_STATUS },
                    });
                    await tx.stockLevel.update({
                        where: { variantId_warehouseId: {
                                variantId: reservation.variantId,
                                warehouseId: reservation.warehouseId,
                            } },
                        data: {
                            reservedQuantity: { decrement: reservation.quantity },
                            availableQuantity: { increment: reservation.quantity },
                        },
                    });
                    await tx.inventoryMovement.create({
                        data: {
                            variantId: reservation.variantId,
                            destinationWarehouseId: reservation.warehouseId,
                            type: 'RESERVATION_RELEASE',
                            quantity: reservation.quantity,
                            unitCost: CANCELLATION_UNIT_COST,
                            referenceId: reservation.id,
                        },
                    });
                });
                successCount++;
                this.logger.log(`[ReservationExpiry] Released reservation ${reservation.id} ` +
                    `(variant: ${reservation.variantId}, qty: ${reservation.quantity})`);
            }
            catch (err) {
                failureCount++;
                this.logger.error(`[ReservationExpiry] FAILED to release reservation ${reservation.id}: ${err.message}`);
            }
        }
        this.logger.log(`[ReservationExpiry] Completed — Released: ${successCount}, Failed: ${failureCount}`);
    }
};
exports.ReservationExpiryJob = ReservationExpiryJob;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservationExpiryJob.prototype, "releaseExpiredReservations", null);
exports.ReservationExpiryJob = ReservationExpiryJob = ReservationExpiryJob_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReservationExpiryJob);
//# sourceMappingURL=reservation-expiry.job.js.map