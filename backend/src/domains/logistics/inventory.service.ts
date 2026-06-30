import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * CORE ENGINE: Records an immutable movement and updates the materialized view.
   */
  async recordMovement(data: {
    variantId: string;
    batchId?: string | null;
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
          batchId: data.batchId || null,
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
        await this.updateStock(transaction, data.variantId, data.batchId || null, data.sourceWarehouseId, data.branchId, data.type, -data.quantity);
      }
      
      // 3. Update Destination Stock (Inbound)
      if (data.destinationWarehouseId) {
        await this.updateStock(transaction, data.variantId, data.batchId || null, data.destinationWarehouseId, data.branchId, data.type, data.quantity);
      }

      // 4. EVENT BOUNDARY (Outbox Pattern)
      await transaction.outboxEvent.create({
        data: {
          aggregate: 'InventoryMovement',
          aggregateId: movement.id,
          type: 'STOCK_MOVEMENT_RECORDED',
          payload: { movementId: movement.id, variantId: movement.variantId, type: movement.type, quantity: movement.quantity }
        }
      });

      return movement;
    };

    if (tx) {
      return execute(tx);
    }

    return this.prisma.$transaction(async (t) => {
      return execute(t);
    });
  }

  private async updateStock(tx: any, variantId: string, batchId: string | null, warehouseId: string, branchId: string | null, type: string, quantityChange: number) {
    // Determine the absolute new balance to prevent drift from relative increments
    const stock = await tx.stockLevel.findFirst({ 
      where: { variantId, warehouseId, batchId: batchId || null } 
    });

    const currentPhysical = stock ? stock.physicalQuantity : 0;
    const currentAvailable = stock ? stock.availableQuantity : 0;
    const currentReserved = stock ? stock.reservedQuantity : 0;

    let newPhysical = currentPhysical;
    let newAvailable = currentAvailable;
    let newReserved = currentReserved;

    if (type === 'RESERVATION') {
      newReserved += Math.abs(quantityChange);
      newAvailable -= Math.abs(quantityChange);
    } else if (type === 'RESERVATION_RELEASE') {
      newReserved -= Math.abs(quantityChange);
      newAvailable += Math.abs(quantityChange);
    } else if (type === 'CONSUME_RESERVATION') {
      newReserved -= Math.abs(quantityChange);
      newPhysical -= Math.abs(quantityChange);
    } else {
      newPhysical += quantityChange;
      newAvailable += quantityChange;
    }

    if (quantityChange < 0 && type !== 'CONSUME_RESERVATION') {
      const posSettings = await this.settingsService.getPosSettings();
      if (!posSettings.allowNegativeStock && newAvailable < 0) {
        throw new BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
      }
    }

    return tx.stockLevel.upsert({
      where: { variantId_warehouseId_batchId: { variantId, warehouseId, batchId } },
      update: {
        physicalQuantity: newPhysical,
        availableQuantity: newAvailable,
        reservedQuantity: newReserved
      },
      create: {
        variantId,
        warehouseId,
        batchId,
        branchId: branchId || undefined,
        physicalQuantity: newPhysical,
        availableQuantity: newAvailable,
        reservedQuantity: newReserved,
      }
    });
  }

  async reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;
    const stock = await prismaClient.stockLevel.findFirst({
      where: { variantId, warehouseId },
      orderBy: { availableQuantity: 'desc' }
    });
    
    const posSettings = await this.settingsService.getPosSettings();

    if (!posSettings.allowNegativeStock) {
      if (!stock || stock.availableQuantity < quantity) {
        throw new BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
      }
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
    const stock = await this.prisma.stockLevel.findFirst({
      where: { variantId: dto.variantId, warehouseId: dto.warehouseId }
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
      const matchingVariants = await this.prisma.productVariant.findMany({
        where: {
          OR: [
            { sku: { contains: query.search, mode: 'insensitive' } },
            { product: { name: { contains: query.search, mode: 'insensitive' } } }
          ]
        },
        select: { id: true }
      });
      where.variantId = { in: matchingVariants.map(v => v.id) };
    }

    const [data, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        orderBy: { warehouseId: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.stockLevel.count({ where }),
    ]);

    // Hydration
    const variantIds = [...new Set(data.map(d => d.variantId))];
    const warehouseIds = [...new Set(data.map(d => d.warehouseId))];
    const branchIds = [...new Set(data.map(d => d.branchId).filter(Boolean))] as string[];

    const [variants, warehouses, branches] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true }
      }),
      this.prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } }
      }),
      this.prisma.branch.findMany({
        where: { id: { in: branchIds } }
      })
    ]);

    const variantMap = new Map(variants.map(v => [v.id, v]));
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    const branchMap = new Map(branches.map(b => [b.id, b]));

    const enriched = data.map(s => {
      const variant = variantMap.get(s.variantId);
      const warehouse = warehouseMap.get(s.warehouseId);
      const branch = s.branchId ? branchMap.get(s.branchId) : null;
      return {
        id: `${s.variantId}-${s.warehouseId}`,
        variantId: s.variantId,
        warehouseId: s.warehouseId,
        branchId: s.branchId,
        physicalQuantity: s.physicalQuantity,
        reservedQuantity: s.reservedQuantity,
        availableQuantity: s.availableQuantity,
        variantSku: variant?.sku || '',
        productName: variant?.product?.name || '',
        warehouseName: warehouse?.name || '',
        branchName: branch?.name || '',
        lastUpdated: s.updatedAt,
      };
    });

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
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    // Hydration
    const variantIds = [...new Set(data.map(m => m.variantId))];
    const warehouseIds = [...new Set(data.flatMap(m => [m.sourceWarehouseId, m.destinationWarehouseId]).filter(Boolean))] as string[];

    const [variants, warehouses] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true }
      }),
      this.prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } }
      })
    ]);

    const variantMap = new Map(variants.map(v => [v.id, v]));
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));

    const enriched = data.map(m => {
      const variant = variantMap.get(m.variantId);
      const sourceWarehouse = m.sourceWarehouseId ? warehouseMap.get(m.sourceWarehouseId) : null;
      const destinationWarehouse = m.destinationWarehouseId ? warehouseMap.get(m.destinationWarehouseId) : null;
      return {
        ...m,
        variantSku: variant?.sku || '',
        productName: variant?.product?.name || '',
        sourceWarehouseName: sourceWarehouse?.name || '',
        destinationWarehouseName: destinationWarehouse?.name || '',
        warehouseName: destinationWarehouse?.name || sourceWarehouse?.name || '', // Helper for UI
      };
    });

    return { data: enriched, total, page, pageSize };
  }

  async processStockAudit(data: { warehouseId: string; items: { variantId?: string; sku?: string; batchId?: string; countedQuantity: number }[] }) {
    const { warehouseId, items } = data;
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new BadRequestException('Warehouse not found');

    return this.prisma.$transaction(async (tx) => {
      let adjustmentCount = 0;
      for (const item of items) {
        let variantId = item.variantId;
        if (!variantId && item.sku) {
          const variant = await tx.productVariant.findUnique({ where: { sku: item.sku } });
          if (!variant) continue; // Skip invalid SKUs or throw
          variantId = variant.id;
        }
        if (!variantId) continue;

        const stockLevel = await tx.stockLevel.findFirst({
          where: { variantId, warehouseId, batchId: item.batchId || null }
        });

        const currentPhysical = stockLevel?.physicalQuantity || 0;
        const difference = item.countedQuantity - currentPhysical;

        if (difference !== 0) {
          adjustmentCount++;
          await this.recordMovement({
            variantId: variantId,
            batchId: item.batchId || null,
            sourceWarehouseId: difference < 0 ? warehouseId : null,
            destinationWarehouseId: difference > 0 ? warehouseId : null,
            branchId: warehouse.branchId,
            type: 'STOCK_TAKE_ADJUSTMENT',
            quantity: Math.abs(difference),
          }, tx);
        }
      }
      return { success: true, adjustmentsMade: adjustmentCount };
    });
  }
}

