import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { StockReservation, ReservationStatus, ReservationLine } from './models/reservation.model';
import { StockMovementService } from '../stock-movement.service';
import * as crypto from 'crypto';

import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly stockService: StockMovementService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * 1. CREATE HOLD (e.g., User adds item to E-commerce Cart)
   * Locks the physical stock for a predefined period (default 15 minutes).
   */
  async createReservation(payload: {
    cartId: string;
    warehouseId: string;
    branchId: string;
    customerId?: string;
    lines: ReservationLine[];
    ttlMinutes?: number;
  }) {
    // Prevent duplicate active holds for the same cart
    const existing = await this.prisma.cartHold.findFirst({
      where: { id: payload.cartId, status: ReservationStatus.ACTIVE }
    });
    if (existing) throw new BadRequestException('An active reservation already exists for this cart.');

    // Secure the stock. If the ledger throws (e.g., physical stock = 0), the reservation fails and cart throws error.
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
        lines: payload.lines as any,
        status: ReservationStatus.ACTIVE,
        expiresAt,
      }
    });

    return reservation;
  }

  /**
   * 2. COMPLETE HOLD (e.g., Payment Successful)
   * The Sales Module will handle the physical `SALE` exit. We just mark the tracking lock as resolved.
   */
  async completeReservation(cartId: string) {
    const reservation = await this.prisma.cartHold.findUnique({ where: { id: cartId } });
    if (!reservation) throw new NotFoundException('Reservation tracking not found');
    
    return this.prisma.cartHold.update({
      where: { id: cartId },
      data: { status: ReservationStatus.COMPLETED }
    });
  }

  /**
   * 3. EXPLICIT CANCEL (e.g., User clears cart or payment gateway explicitly declines)
   */
  async cancelReservation(cartId: string) {
    const reservation = await this.prisma.cartHold.findUnique({ where: { id: cartId } });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== ReservationStatus.ACTIVE) {
       throw new BadRequestException('Only active reservations can be explicitly cancelled.');
    }

    // Release stock back to the sellable pool
    const lines = reservation.lines as any as ReservationLine[];
    for (const line of lines) {
      await this.stockService['inventoryLedger'].releaseReservation(
        line.variantId,
        reservation.warehouseId,
        reservation.branchId,
        line.quantity,
        `CART-${cartId}`
      );
    }

    return this.prisma.cartHold.update({
      where: { id: cartId },
      data: { status: ReservationStatus.CANCELLED }
    });
  }

  /**
   * 4. BACKGROUND SWEEP (Cron Job)
   * In production, this executes every 60 seconds.
   * Finds carts that users abandoned and unlocks the stock for other customers.
   */
  async sweepExpiredReservations() {
    const now = new Date();
    const expiredHolds = await this.prisma.cartHold.findMany({
      where: { status: ReservationStatus.ACTIVE, expiresAt: { lt: now } }
    });

    let releasedCount = 0;
    for (const hold of expiredHolds) {
      const lines = hold.lines as any as ReservationLine[];
      // Release stock in the double-entry ledger
      for (const line of lines) {
        await this.stockService['inventoryLedger'].releaseReservation(
          line.variantId,
          hold.warehouseId,
          hold.branchId,
          line.quantity,
          `CART-${hold.id}`
        );
      }
      
      await this.prisma.cartHold.update({
        where: { id: hold.id },
        data: { status: ReservationStatus.EXPIRED }
      });
      releasedCount++;
    }

    return { sweptCount: releasedCount };
  }
}
