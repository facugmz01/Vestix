import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/prisma/prisma.service';

const RESERVATION_EXPIRY_STATUS  = 'ACTIVE';
const RESERVATION_EXPIRED_STATUS = 'EXPIRED';
const CANCELLATION_UNIT_COST     = 0; // Stock released with zero cost — it was never sold

/**
 * ReservationExpiryJob
 *
 * Cron job that runs every 5 minutes to identify and release expired e-commerce
 * stock reservations. Prevents ghost holds caused by:
 *  - Abandoned carts (user closed browser mid-checkout)
 *  - Payment webhook delivery failures
 *  - Payment gateway timeouts
 *
 * Idempotency: operates only on `status = 'ACTIVE'` records. A second run within
 * the same window is always a no-op on already-expired records.
 *
 * Audit: StockReservation.update + StockLevel.update + InventoryMovement.create
 * are all captured automatically by the global Prisma Audit Middleware.
 */
@Injectable()
export class ReservationExpiryJob {
  private readonly logger = new Logger(ReservationExpiryJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpiredReservations() {
    const now = new Date();
    this.logger.log(`[ReservationExpiry] Running cleanup at ${now.toISOString()}`);

    // 1. Find all expired ACTIVE reservations in a single, indexed query
    const expired = await this.prisma.stockReservation.findMany({
      where: {
        status:    RESERVATION_EXPIRY_STATUS,
        expiresAt: { lt: now },
      },
      // Process in bounded batches to avoid loading unbounded data into memory
      take: 500,
    });

    if (expired.length === 0) {
      this.logger.log('[ReservationExpiry] No expired reservations found. Exiting.');
      return;
    }

    this.logger.warn(`[ReservationExpiry] Found ${expired.length} expired reservation(s). Releasing...`);

    let successCount = 0;
    let failureCount = 0;

    // 2. Release each reservation atomically
    for (const reservation of expired) {
      try {
        await this.prisma.$transaction(async (tx) => {
          // A. Mark reservation as EXPIRED (idempotency guard — prevents double-release)
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data:  { status: RESERVATION_EXPIRED_STATUS },
          });

          // B. Return reserved quantity back to available stock
          // Keep invariant: available = physical − reserved (only reserved changes)
          const stock = await tx.stockLevel.findFirst({
            where: {
              variantId: reservation.variantId,
              warehouseId: reservation.warehouseId,
            },
            orderBy: { availableQuantity: 'desc' },
          });
          if (stock) {
            const newReserved = Math.max(0, stock.reservedQuantity - reservation.quantity);
            await tx.stockLevel.update({
              where: { id: stock.id },
              data: {
                reservedQuantity: newReserved,
                availableQuantity: stock.physicalQuantity - newReserved,
              },
            });
          }

          // C. Record an RESERVATION_RELEASE inventory movement for traceability
          await tx.inventoryMovement.create({
            data: {
              variantId:        reservation.variantId,
              destinationWarehouseId: reservation.warehouseId,
              type:             'RESERVATION_RELEASE',
              quantity:         reservation.quantity,
              unitCost:         CANCELLATION_UNIT_COST,
              referenceId:      reservation.id,
            },
          });
        });

        successCount++;
        this.logger.log(
          `[ReservationExpiry] Released reservation ${reservation.id} ` +
          `(variant: ${reservation.variantId}, qty: ${reservation.quantity})`
        );
      } catch (err: any) {
        // Non-blocking: log failure and continue to release the remaining reservations
        failureCount++;
        this.logger.error(
          `[ReservationExpiry] FAILED to release reservation ${reservation.id}: ${err.message}`
        );
      }
    }

    this.logger.log(
      `[ReservationExpiry] Completed — Released: ${successCount}, Failed: ${failureCount}`
    );
  }
}
