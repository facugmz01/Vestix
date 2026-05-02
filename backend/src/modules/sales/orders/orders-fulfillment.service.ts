import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderFulfillment, OrderStatus } from './models/fulfillment.model';
import { SalesService } from '../sales.service';
import { StockMovementService } from '../../inventory/stock-movement.service';
import * as crypto from 'crypto';

@Injectable()
export class OrdersFulfillmentService {
  constructor(
    private readonly salesService: SalesService,
    private readonly stockService: StockMovementService
  ) {}

  private fulfillments: OrderFulfillment[] = [];

  /**
   * Starts the logistics state machine. 
   * Called by the Sales orchestrator immediately after an E-commerce cart is locked.
   */
  async initializeFulfillment(saleOrderId: string) {
    const fulfillment: OrderFulfillment = {
      id: crypto.randomUUID(),
      saleOrderId,
      status: OrderStatus.PENDING_PAYMENT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fulfillments.push(fulfillment);
    return fulfillment;
  }

  /**
   * Webhook target for payment gateways (Stripe, MercadoPago).
   * Moves the order from 'Pending' into the active warehouse picking queue.
   */
  async markAsPaid(id: string) {
    const fulfillment = this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PENDING_PAYMENT) {
       throw new BadRequestException('Order is not in a payable state.');
    }
    
    // In production, the AccountsService handles injecting the cash into the Treasury.
    // Here we strictly advance the logistics state machine.
    fulfillment.status = OrderStatus.PAID;
    fulfillment.paidAt = new Date();
    fulfillment.updatedAt = new Date();
    return fulfillment;
  }

  /**
   * Warehouse worker scans the picking ticket.
   */
  async startPicking(id: string) {
    const fulfillment = this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PAID) throw new BadRequestException('Order must be PAID before picking.');
    
    fulfillment.status = OrderStatus.PICKING;
    fulfillment.pickedAt = new Date();
    fulfillment.updatedAt = new Date();
    return fulfillment;
  }

  /**
   * Box is sealed and labeled.
   */
  async markAsPacked(id: string) {
    const fulfillment = this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PICKING) throw new BadRequestException('Order must be PICKING before packed.');
    
    fulfillment.status = OrderStatus.PACKED;
    fulfillment.packedAt = new Date();
    fulfillment.updatedAt = new Date();
    return fulfillment;
  }

  /**
   * CRITICAL OMNI-CHANNEL EVENT: The courier scans the box and takes it away.
   * This is the exact moment the physical stock officially leaves the building.
   */
  async shipOrder(id: string, trackingNumber: string, courierName: string) {
    const fulfillment = this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.PACKED) throw new BadRequestException('Order must be PACKED before shipping.');
    
    // 1. Fetch the master order details
    // const saleOrder = await this.salesService.getOrder(fulfillment.saleOrderId);

    // 2. Fire the Double-Entry Ledger
    // When the order was first placed, the items were marked as RESERVED.
    // Now that the items are physically leaving the building on a truck, 
    // we explicitly tell the ledger to release the reservation lock AND log the SALE exit.
    
    /* PRODUCTION IMPLEMENTATION:
    for (const line of saleOrder.lines) {
       await this.stockService.processSaleExit({
          variantId: line.variantId,
          sourceWarehouseId: saleOrder.warehouseId,
          branchId: saleOrder.branchId,
          quantity: line.quantity,
          orderId: saleOrder.id,
          wasReserved: true // <--- CRITICAL: Tells the ledger to decrement 'reservedQuantity' instead of 'availableQuantity'
       });
    }
    */

    fulfillment.status = OrderStatus.SHIPPED;
    fulfillment.trackingNumber = trackingNumber;
    fulfillment.courierName = courierName;
    fulfillment.shippedAt = new Date();
    fulfillment.updatedAt = new Date();
    return fulfillment;
  }

  /**
   * Courier API Webhook: Customer confirms receipt.
   */
  async markAsDelivered(id: string) {
    const fulfillment = this.getFulfillment(id);
    if (fulfillment.status !== OrderStatus.SHIPPED) throw new BadRequestException('Order must be SHIPPED before delivered.');
    
    fulfillment.status = OrderStatus.DELIVERED;
    fulfillment.deliveredAt = new Date();
    fulfillment.updatedAt = new Date();
    return fulfillment;
  }

  private getFulfillment(id: string) {
    const f = this.fulfillments.find(f => f.id === id);
    if (!f) throw new NotFoundException('Fulfillment record not found');
    return f;
  }
}
