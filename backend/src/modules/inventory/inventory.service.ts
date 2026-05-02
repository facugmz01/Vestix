import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * CORE ENGINE: Records an immutable movement and updates the materialized view.
   */
  async recordMovement(data: {
    variantId: string;
    sourceWarehouseId: string | null;
    destinationWarehouseId: string | null;
    branchId: string | null;
    type: string;
    quantity: number;
    unitCost?: number;
    referenceId?: string;
  }) {
    if (data.quantity <= 0) {
      throw new BadRequestException('La cantidad del movimiento debe ser mayor a cero.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Write the Immutable Ledger Record
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: data.variantId,
          sourceWarehouseId: data.sourceWarehouseId,
          destinationWarehouseId: data.destinationWarehouseId,
          type: data.type,
          quantity: data.quantity,
          unitCost: data.unitCost || 0,
          referenceId: data.referenceId || null,
        },
      });

      // 2. Update Source Stock (Outbound)
      if (data.sourceWarehouseId) {
        await this.updateStock(tx, data.variantId, data.sourceWarehouseId, data.branchId, data.type, -data.quantity);
      }
      
      // 3. Update Destination Stock (Inbound)
      if (data.destinationWarehouseId) {
        await this.updateStock(tx, data.variantId, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
      }

      return movement;
    });
  }

  private async updateStock(tx: any, variantId: string, warehouseId: string, branchId: string | null, type: string, quantityChange: number) {
    // Determine which field to update based on movement type
    // Note: quantityChange is positive for inbound, negative for outbound
    
    let updateData: any = {};
    if (type === 'RESERVATION') {
      // Reservation increases reserved and decreases available
      updateData = {
        reservedQuantity: { increment: Math.abs(quantityChange) },
        availableQuantity: { decrement: Math.abs(quantityChange) }
      };
    } else if (type === 'RESERVATION_RELEASE') {
      // Release decreases reserved and increases available
      updateData = {
        reservedQuantity: { decrement: Math.abs(quantityChange) },
        availableQuantity: { increment: Math.abs(quantityChange) }
      };
    } else {
      // Normal movement affects physical and available
      updateData = {
        physicalQuantity: { increment: quantityChange },
        availableQuantity: { increment: quantityChange }
      };
    }

    // Upsert the stock level record
    return tx.stockLevel.upsert({
      where: { variantId_warehouseId: { variantId, warehouseId } },
      update: updateData,
      create: {
        variantId,
        warehouseId,
        branchId: branchId || undefined,
        physicalQuantity: quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : 0) : 0,
        availableQuantity: quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : -quantityChange) : 0,
        reservedQuantity: type === 'RESERVATION' ? Math.abs(quantityChange) : 0,
      }
    });
  }

  async reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string) {
    const stock = await this.prisma.stockLevel.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } }
    });
    
    if (!stock || stock.availableQuantity < quantity) {
      throw new BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
    }

    return this.recordMovement({
      variantId,
      sourceWarehouseId: null,
      destinationWarehouseId: warehouseId,
      branchId,
      type: 'RESERVATION',
      quantity,
      referenceId: orderId
    });
  }

  async releaseReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string) {
    return this.recordMovement({
      variantId,
      sourceWarehouseId: warehouseId,
      destinationWarehouseId: null,
      branchId,
      type: 'RESERVATION_RELEASE',
      quantity,
      referenceId: orderId
    });
  }

  async getStockPerBranch(branchId: string, variantId?: string) {
    return this.prisma.stockLevel.findMany({
      where: { branchId, ...(variantId ? { variantId } : {}) }
    });
  }

  async getStockPerWarehouse(warehouseId: string, variantId?: string) {
    return this.prisma.stockLevel.findMany({
      where: { warehouseId, ...(variantId ? { variantId } : {}) }
    });
  }
}
