import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderFulfillment, OrderStatus } from './models/fulfillment.model';
import { SalesService } from '../sales.service';
import { StockMovementService } from '../../logistics/stock-movement.service';
import * as crypto from 'crypto';

import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class OrdersFulfillmentService {
  constructor(
    private readonly salesService: SalesService,
    private readonly stockService: StockMovementService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Starts the logistics state machine. 
   * Called by the Sales orchestrator immediately after an E-commerce cart is locked.
   */
  async initializeFulfillment(saleOrderId: string) {
    return this.prisma.orderFulfillment.create({
      data: {
        id: crypto.randomUUID(),
        saleOrderId,
        status: OrderStatus.PENDING_PAYMENT,
      }
    });
  }

  /**
   * Webhook target for payment gateways (Stripe, MercadoPago).
   * Moves the order from 'Pending' into the active warehouse picking queue.
   */
  async markAsPaid(id: string) {
    const fulfillment = await this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PENDING_PAYMENT) {
       throw new BadRequestException('Order is not in a payable state.');
    }
    
    // In production, the AccountsService handles injecting the cash into the Treasury.
    // Here we strictly advance the logistics state machine.
    return this.prisma.orderFulfillment.update({
      where: { id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date()
      }
    });
  }

  /**
   * Warehouse worker scans the picking ticket.
   */
  async startPicking(id: string) {
    const fulfillment = await this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PAID) throw new BadRequestException('Order must be PAID before picking.');
    
    return this.prisma.orderFulfillment.update({
      where: { id },
      data: {
        status: OrderStatus.PICKING,
        pickedAt: new Date()
      }
    });
  }

  /**
   * Box is sealed and labeled.
   */
  async markAsPacked(id: string) {
    const fulfillment = await this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PICKING) throw new BadRequestException('Order must be PICKING before packed.');
    
    return this.prisma.orderFulfillment.update({
      where: { id },
      data: {
        status: OrderStatus.PACKED,
        packedAt: new Date()
      }
    });
  }

  /**
   * Advances fulfillment to SHIPPED.
   * E-commerce inventory is consumed at payment approval (consumeReservation in MP webhook).
   * Ship time only records the logistics handoff — no additional stock movement.
   */
  async shipOrder(id: string, trackingNumber: string, courierName: string) {
    const fulfillment = await this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PACKED) {
      throw new BadRequestException('Order must be PACKED before shipping.');
    }

    return this.prisma.orderFulfillment.update({
      where: { id },
      data: {
        status: OrderStatus.SHIPPED,
        trackingNumber,
        courierName,
        shippedAt: new Date(),
      },
    });
  }

  /**
   * Courier API Webhook: Customer confirms receipt.
   */
  async markAsDelivered(id: string) {
    const fulfillment = await this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.SHIPPED) throw new BadRequestException('Order must be SHIPPED before delivered.');
    
    return this.prisma.orderFulfillment.update({
      where: { id },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date()
      }
    });
  }

  private async getFulfillment(id: string) {
    const f = await this.prisma.orderFulfillment.findUnique({ where: { id } });
    if (!f) throw new NotFoundException('Fulfillment record not found');
    return f;
  }
}
