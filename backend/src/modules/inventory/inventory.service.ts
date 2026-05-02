import { Injectable, BadRequestException } from '@nestjs/common';
import { InventoryMovement, MovementType } from './models/inventory-movement.model';
import { StockLevel } from './models/stock-level.model';
import * as crypto from 'crypto';

@Injectable()
export class InventoryService {
  // Database Tables / Collections
  private movements: InventoryMovement[] = [];
  
  // Represents a Materialized View in PostgreSQL or a Redis Cache mapping 'variantId_warehouseId' to Stock
  private stockLevels: Map<string, StockLevel> = new Map(); 

  /**
   * CORE ENGINE: Records an immutable movement and updates the materialized view.
   */
  async recordMovement(data: {
    variantId: string;
    sourceWarehouseId: string | null;
    destinationWarehouseId: string | null;
    branchId: string | null; // For stock-level denormalization
    type: MovementType;
    quantity: number;
    unitCost?: number;
    referenceId?: string;
  }) {
    if (data.quantity <= 0) {
      throw new BadRequestException('Movement quantity must be strictly positive.');
    }

    // 1. Write the Immutable Ledger Record
    const movement: InventoryMovement = {
      id: crypto.randomUUID(),
      variantId: data.variantId,
      sourceWarehouseId: data.sourceWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      type: data.type,
      quantity: data.quantity,
      unitCost: data.unitCost || 0, // WAC calculated here in production
      referenceId: data.referenceId || null,
      createdAt: new Date(),
    };
    this.movements.push(movement);

    // 2. Incrementally Update the Fast-Read Cache
    // In production, this executes inside the same DB Transaction as the movement insert.
    if (data.sourceWarehouseId) {
      this.processOutbound(data.variantId, data.sourceWarehouseId, data.type, data.quantity);
    }
    
    if (data.destinationWarehouseId) {
      this.processInbound(data.variantId, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
    }

    return movement;
  }

  /**
   * Crucial for Omni-Channel: Reserves stock immediately when an E-commerce order is placed.
   */
  async reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string) {
    const stock = this.getStock(variantId, warehouseId);
    
    // We enforce availability checks for online orders to prevent selling phantom stock
    if (!stock || stock.availableQuantity < quantity) {
      throw new BadRequestException(`Insufficient available stock for variant ${variantId}. Cannot fulfill online order.`);
    }

    return this.recordMovement({
      variantId,
      sourceWarehouseId: null, // Reservations happen within the same warehouse, logic handled by MovementType
      destinationWarehouseId: warehouseId,
      branchId,
      type: MovementType.RESERVATION,
      quantity,
      referenceId: orderId
    });
  }

  /**
   * Reverses a reservation if a payment fails or the customer cancels.
   */
  async releaseReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string) {
    return this.recordMovement({
      variantId,
      sourceWarehouseId: warehouseId,
      destinationWarehouseId: null,
      branchId,
      type: MovementType.RESERVATION_RELEASE,
      quantity,
      referenceId: orderId
    });
  }

  // --- QUERY METHODS ---

  /**
   * Gets real-time stock across an entire physical branch (e.g. sums STORE_FRONT + BACKROOM).
   */
  getStockPerBranch(branchId: string, variantId?: string): StockLevel[] {
    return Array.from(this.stockLevels.values()).filter(lvl => 
      lvl.branchId === branchId && (!variantId || lvl.variantId === variantId)
    );
  }

  /**
   * Gets real-time stock isolated to a specific warehouse room.
   */
  getStockPerWarehouse(warehouseId: string, variantId?: string): StockLevel[] {
    return Array.from(this.stockLevels.values()).filter(lvl => 
      lvl.warehouseId === warehouseId && (!variantId || lvl.variantId === variantId)
    );
  }

  // --- INTERNAL STATE LOGIC ---

  private processInbound(variantId: string, warehouseId: string, branchId: string | null, type: MovementType, quantity: number) {
    const key = `${variantId}_${warehouseId}`;
    if (!this.stockLevels.has(key)) {
      this.stockLevels.set(key, { variantId, warehouseId, branchId, physicalQuantity: 0, reservedQuantity: 0, availableQuantity: 0, updatedAt: new Date() });
    }
    
    const stock = this.stockLevels.get(key)!;

    if (type === MovementType.RESERVATION) {
      stock.reservedQuantity += quantity;
      stock.availableQuantity -= quantity; // Physical quantity does not change, it's just claimed.
    } else {
      stock.physicalQuantity += quantity;
      stock.availableQuantity += quantity;
    }
    stock.updatedAt = new Date();
  }

  private processOutbound(variantId: string, warehouseId: string, type: MovementType, quantity: number) {
    const key = `${variantId}_${warehouseId}`;
    const stock = this.stockLevels.get(key);
    
    if (!stock) return; 

    if (type === MovementType.RESERVATION_RELEASE) {
      stock.reservedQuantity -= quantity;
      stock.availableQuantity += quantity; // Item is freed up to be sold again
    } else if (type === MovementType.SALE) {
      stock.physicalQuantity -= quantity;
      // Note: If the sale was from an online order, it would release the reservation first.
      // If it's a direct POS sale, we just reduce available.
      stock.availableQuantity -= quantity; 
    } else {
      stock.physicalQuantity -= quantity;
      stock.availableQuantity -= quantity;
    }
    stock.updatedAt = new Date();
  }

  private getStock(variantId: string, warehouseId: string) {
    return this.stockLevels.get(`${variantId}_${warehouseId}`);
  }
}
