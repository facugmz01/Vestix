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
  }, tx?: any) {
    if (data.quantity <= 0) {
      throw new BadRequestException('La cantidad del movimiento debe ser mayor a cero.');
    }

    const execute = async (transaction: any) => {
      // 1. Write the Immutable Ledger Record
      const movement = await transaction.inventoryMovement.create({
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
        await this.updateStock(transaction, data.variantId, data.sourceWarehouseId, data.branchId, data.type, -data.quantity);
      }
      
      // 3. Update Destination Stock (Inbound)
      if (data.destinationWarehouseId) {
        await this.updateStock(transaction, data.variantId, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
      }

      return movement;
    };

    if (tx) {
      return execute(tx);
    }

    return this.prisma.$transaction(async (t) => {
      return execute(t);
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
    } else if (type === 'CONSUME_RESERVATION') {
      // Consume decreases reserved and decreases physical (available stays same because it was already reduced on RESERVATION)
      updateData = {
        reservedQuantity: { decrement: Math.abs(quantityChange) },
        physicalQuantity: { decrement: Math.abs(quantityChange) }
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
        physicalQuantity: type === 'CONSUME_RESERVATION' ? -Math.abs(quantityChange) : (quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : 0) : 0),
        availableQuantity: type === 'CONSUME_RESERVATION' ? 0 : (quantityChange > 0 ? (type !== 'RESERVATION' ? quantityChange : -quantityChange) : 0),
        reservedQuantity: type === 'RESERVATION' ? Math.abs(quantityChange) : 0,
      }
    });
  }

  async reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;
    const stock = await prismaClient.stockLevel.findUnique({
      where: { variantId_warehouseId: { variantId, warehouseId } }
    });
    
    if (!stock || stock.availableQuantity < quantity) {
      throw new BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
    }

    const movement = await this.recordMovement({
      variantId,
      sourceWarehouseId: null,
      destinationWarehouseId: warehouseId,
      branchId,
      type: 'RESERVATION',
      quantity,
      referenceId: orderId
    }, tx);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Default 15 minutes TTL

    await prismaClient.stockReservation.create({
      data: {
        stockLevelId: stock.id,
        variantId,
        warehouseId,
        quantity,
        orderId,
        status: 'ACTIVE',
        expiresAt
      }
    });

    return movement;
  }

  async releaseReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;
    
    const reservation = await prismaClient.stockReservation.findFirst({
      where: {
        orderId,
        variantId,
        warehouseId,
        status: 'ACTIVE'
      }
    });

    if (reservation) {
      await prismaClient.stockReservation.update({
        where: { id: reservation.id },
        data: { status: 'CANCELLED' }
      });
    }

    return this.recordMovement({
      variantId,
      sourceWarehouseId: warehouseId,
      destinationWarehouseId: null,
      branchId,
      type: 'RESERVATION_RELEASE',
      quantity,
      referenceId: orderId
    }, tx);
  }

  async consumeReservation(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;
    
    const reservation = await prismaClient.stockReservation.findFirst({
      where: {
        orderId,
        variantId,
        warehouseId,
        status: 'ACTIVE'
      }
    });

    if (reservation) {
      await prismaClient.stockReservation.update({
        where: { id: reservation.id },
        data: { status: 'CONSUMED' }
      });
    }

    return this.recordMovement({
      variantId,
      sourceWarehouseId: warehouseId,
      destinationWarehouseId: null,
      branchId,
      type: 'CONSUME_RESERVATION',
      quantity,
      referenceId: orderId
    }, tx);
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

  async adjustStock(dto: { variantId: string; warehouseId: string; quantity: number; type: 'ADD' | 'SUBTRACT' | 'SET'; reason: string }) {
    const stock = await this.prisma.stockLevel.findUnique({
      where: { variantId_warehouseId: { variantId: dto.variantId, warehouseId: dto.warehouseId } },
      include: { warehouse: true }
    });

    let diff = 0;
    if (dto.type === 'ADD') {
      diff = dto.quantity;
    } else if (dto.type === 'SUBTRACT') {
      diff = -dto.quantity;
    } else if (dto.type === 'SET') {
      diff = dto.quantity - (stock?.availableQuantity || 0);
    }

    if (diff === 0) return stock;

    return this.recordMovement({
      variantId: dto.variantId,
      sourceWarehouseId: diff < 0 ? dto.warehouseId : null,
      destinationWarehouseId: diff > 0 ? dto.warehouseId : null,
      branchId: stock?.branchId || null,
      type: 'ADJUSTMENT',
      quantity: Math.abs(diff),
      referenceId: dto.reason
    });
  }

  async findAllStock(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.warehouseId) where.warehouseId = query.warehouseId;
    
    if (query.search) {
      where.variant = {
        OR: [
          { sku: { contains: query.search, mode: 'insensitive' } },
          { product: { name: { contains: query.search, mode: 'insensitive' } } }
        ]
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        include: {
          variant: { include: { product: true } },
          warehouse: true,
          branch: true
        },
        orderBy: { warehouseId: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    const enriched = data.map(s => ({
      id: `${s.variantId}-${s.warehouseId}`,
      variantId: s.variantId,
      warehouseId: s.warehouseId,
      branchId: s.branchId,
      physicalQuantity: s.physicalQuantity,
      reservedQuantity: s.reservedQuantity,
      availableQuantity: s.availableQuantity,
      variantSku: s.variant?.sku || '',
      productName: s.variant?.product?.name || '',
      warehouseName: s.warehouse?.name || '',
      branchName: s.branch?.name || '',
      lastUpdated: s.updatedAt,
    }));

    return { data: enriched, total, page, pageSize };
  }

  async findAllMovements(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.warehouseId) {
      where.OR = [
        { sourceWarehouseId: query.warehouseId },
        { destinationWarehouseId: query.warehouseId }
      ];
    }
    if (query.variantId) where.variantId = query.variantId;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          variant: { include: { product: true } },
          sourceWarehouse: true,
          destinationWarehouse: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    const enriched = data.map(m => ({
      ...m,
      variantSku: m.variant?.sku || '',
      productName: m.variant?.product?.name || '',
      sourceWarehouseName: m.sourceWarehouse?.name || '',
      destinationWarehouseName: m.destinationWarehouse?.name || '',
      warehouseName: m.destinationWarehouse?.name || m.sourceWarehouse?.name || '', // Helper for UI
    }));

    return { data: enriched, total, page, pageSize };
  }
}

