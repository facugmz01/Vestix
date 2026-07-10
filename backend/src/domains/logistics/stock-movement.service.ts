import { Injectable, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { MovementType } from './models/inventory-movement.model';
import { PrismaService } from '../../core/prisma/prisma.service';

// CostingService (domains/finance/costing.service) is not implemented yet.
// WAC is computed inline in calculateSimpleWac using variant.costPrice.

@Injectable()
export class StockMovementService {
  constructor(
    private readonly inventoryLedger: InventoryService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * ENTRIES: Process Goods Receipt from a Supplier (Purchase Order Delivery).
   * Brings new inventory into the system and establishes the new Weighted Average Cost.
   */
  async processGoodsReceipt(payload: {
    variantId: string;
    destinationWarehouseId: string;
    branchId: string;
    quantity: number;
    purchaseCost: number;
    purchaseOrderId: string;
    batchId?: string;
  }, tx?: any) {
    // Weighted Average Cost (WAC): blends existing stock cost with incoming purchase cost.
    // CostingService (not yet implemented) would centralize this; until then we use
    // variant.costPrice as the current unit cost and recompute on each goods receipt.
    const unitCost = await this.calculateSimpleWac(
      payload.variantId,
      payload.destinationWarehouseId,
      payload.quantity,
      payload.purchaseCost,
      tx,
    );

    return this.inventoryLedger.recordMovement({
      variantId: payload.variantId,
      sourceWarehouseId: null,
      destinationWarehouseId: payload.destinationWarehouseId,
      branchId: payload.branchId,
      type: MovementType.GOODS_RECEIPT,
      quantity: payload.quantity,
      unitCost,
      referenceId: payload.purchaseOrderId,
      batchId: payload.batchId,
    }, tx);
  }

  /**
   * Simple WAC: (currentQty × currentCost + incomingQty × purchaseCost) / (currentQty + incomingQty).
   * Persists the new average on ProductVariant.costPrice when stock exists.
   */
  private async calculateSimpleWac(
    variantId: string,
    warehouseId: string,
    incomingQty: number,
    purchaseCost: number,
    tx?: any,
  ): Promise<number> {
    const prisma = tx || this.prisma;
    const [variant, stockLevels] = await Promise.all([
      prisma.productVariant.findUnique({ where: { id: variantId } }),
      prisma.stockLevel.findMany({ where: { variantId, warehouseId } }),
    ]);

    const currentQty = stockLevels.reduce((sum: number, s: any) => sum + s.physicalQuantity, 0);
    const currentCost = variant?.costPrice ?? purchaseCost;

    if (currentQty <= 0) {
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { costPrice: purchaseCost },
      });
      return purchaseCost;
    }

    const newWac = (currentQty * currentCost + incomingQty * purchaseCost) / (currentQty + incomingQty);
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { costPrice: newWac },
    });
    return newWac;
  }

  /**
   * EXITS: Process a standard POS Sale or E-Commerce Shipment.
   * Decrements physical stock and logs Cost of Goods Sold (COGS).
   */
  async processSaleExit(payload: {
    variantId: string;
    sourceWarehouseId: string;
    branchId: string;
    quantity: number;
    orderId: string;
    wasReserved: boolean; // True if this was an e-commerce order that was previously reserved
  }, tx?: any) {
    if (payload.wasReserved) {
      // If it was an online order, we must free the 'reserved' status before the physical items can leave the building
      await this.inventoryLedger.releaseReservation(
        payload.variantId, 
        payload.sourceWarehouseId, 
        payload.branchId, 
        payload.quantity, 
        payload.orderId,
        tx
      );
    }

    return this.inventoryLedger.recordMovement({
      variantId: payload.variantId,
      sourceWarehouseId: payload.sourceWarehouseId,
      destinationWarehouseId: null, // Leaves the internal system to the customer
      branchId: payload.branchId,
      type: MovementType.SALE,
      quantity: payload.quantity,
      // unitCost: We lock in the current WAC here for the COGS financial report
      referenceId: payload.orderId,
    }, tx);
  }

  /**
   * ADJUSTMENTS: Process a Blind Count Correction or Shrinkage (Theft/Damage).
   * Strict Rule: In V2 Architecture, we NEVER use negative numbers. 
   * If stock is missing, it is recorded as an explicit SHRINKAGE outbound movement.
   */
  async processAdjustment(payload: {
    variantId: string;
    warehouseId: string;
    branchId: string;
    countedQuantity: number;
    reason: string; // e.g., "Theft", "Damaged", "Count Correction"
    userId: string;
  }, tx?: any) {
    // 1. Get current system stock
    const currentStockArr = await this.inventoryLedger.getStockPerWarehouse(payload.warehouseId, payload.variantId);
    const currentStock = currentStockArr.length > 0 ? currentStockArr[0].physicalQuantity : 0;

    if (payload.countedQuantity === currentStock) {
      return { status: 'NO_CHANGE', message: 'Physical count matches system stock perfectly.' };
    }

    // 2. Determine difference and direction of movement
    const difference = payload.countedQuantity - currentStock;

    if (difference < 0) {
      // Missing stock -> Shrinkage (Outbound)
      return this.inventoryLedger.recordMovement({
        variantId: payload.variantId,
        sourceWarehouseId: payload.warehouseId,
        destinationWarehouseId: null,
        branchId: payload.branchId,
        type: MovementType.SHRINKAGE,
        quantity: Math.abs(difference),
        referenceId: `ADJ-${payload.userId}-${payload.reason}`,
      }, tx);
    } else {
      // Found extra stock -> Correction (Inbound)
      // Crucial for resolving offline POS queues where the system thought we had 0 stock,
      // but a cashier physically sold 1 item.
      return this.inventoryLedger.recordMovement({
        variantId: payload.variantId,
        sourceWarehouseId: null,
        destinationWarehouseId: payload.warehouseId,
        branchId: payload.branchId,
        type: MovementType.POS_CORRECTION,
        quantity: Math.abs(difference),
        referenceId: `ADJ-${payload.userId}-${payload.reason}`,
      }, tx);
    }
  }

  /**
   * RESERVATIONS: Explicit API for E-commerce Cart Checkout.
   * Secures items while a customer is entering credit card details.
   */
  async processReservation(payload: {
    variantId: string;
    warehouseId: string;
    branchId: string;
    quantity: number;
    orderId: string;
  }, tx?: any) {
    return this.inventoryLedger.reserveStock(
      payload.variantId,
      payload.warehouseId,
      payload.branchId,
      payload.quantity,
      payload.orderId,
      tx
    );
  }
}
