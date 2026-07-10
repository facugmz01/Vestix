import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import * as crypto from 'crypto';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly notificationTriggers: NotificationTriggersService,
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

    this.assertMovementDirection(data.type, data.sourceWarehouseId, data.destinationWarehouseId);

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

      // 2. Update Source Stock (Outbound) — decreases physical/available
      if (data.sourceWarehouseId) {
        await this.updateStock(transaction, data.variantId, data.batchId || null, data.sourceWarehouseId, data.branchId, data.type, -data.quantity);
      }
      
      // 3. Update Destination Stock (Inbound) — increases physical/available
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

    const movement = await this.prisma.$transaction(async (t) => execute(t));

    if (data.sourceWarehouseId) {
      void this.notificationTriggers.checkLowStock(
        data.variantId,
        data.sourceWarehouseId,
        data.branchId,
      );
    }

    return movement;
  }

  /**
   * Ensures outbound types cannot be recorded as inbound (and vice versa).
   * Prevents sales/returns from accidentally increasing Disponible.
   */
  private assertMovementDirection(
    type: string,
    sourceWarehouseId: string | null,
    destinationWarehouseId: string | null,
  ) {
    const OUTBOUND = new Set([
      'SALE',
      'SALE_EXIT',
      'TRANSFER_OUT',
      'SHRINKAGE',
      'CONSUME_RESERVATION',
      'SUBTRACT',
    ]);
    const INBOUND = new Set([
      'GOODS_RECEIPT',
      'SALE_RETURN',
      'RETURN',
      'TRANSFER_IN',
      'POS_CORRECTION',
      'INITIAL_STOCK',
      'ADD',
    ]);
    // Reservation types use destination/source for warehouse targeting but don't move physical stock
    const RESERVATION_TYPES = new Set(['RESERVATION', 'RESERVATION_RELEASE']);

    if (OUTBOUND.has(type) && !sourceWarehouseId) {
      throw new BadRequestException(
        `El movimiento ${type} requiere depósito de origen (salida de stock).`,
      );
    }
    if (INBOUND.has(type) && !destinationWarehouseId) {
      throw new BadRequestException(
        `El movimiento ${type} requiere depósito de destino (entrada de stock).`,
      );
    }
    // Guard against double-sided recording for pure outbound/inbound (would net to zero or double-apply)
    if (OUTBOUND.has(type) && destinationWarehouseId && !RESERVATION_TYPES.has(type)) {
      throw new BadRequestException(
        `El movimiento ${type} no puede tener depósito de destino (es una salida).`,
      );
    }
    if (INBOUND.has(type) && sourceWarehouseId) {
      throw new BadRequestException(
        `El movimiento ${type} no puede tener depósito de origen (es una entrada).`,
      );
    }
  }

  /**
   * Applies a signed quantityChange to a stock node.
   * quantityChange < 0 = outbound (sale, transfer out, shrinkage, adjustment down)
   * quantityChange > 0 = inbound (receipt, return, transfer in, adjustment up)
   *
   * INVARIANT: availableQuantity is ALWAYS derived as physical − reserved.
   * Never increment/decrement available independently — that caused Disponible
   * to drift upward on every movement when physical/reserved got out of sync.
   */
  private async updateStock(tx: any, variantId: string, batchId: string | null, warehouseId: string, branchId: string | null, type: string, quantityChange: number) {
    const stock = await tx.stockLevel.findFirst({
      where: { variantId, warehouseId, batchId: batchId || null },
    });

    let newPhysical = stock ? stock.physicalQuantity : 0;
    let newReserved = stock ? stock.reservedQuantity : 0;
    const absQty = Math.abs(quantityChange);

    if (type === 'RESERVATION') {
      // Hold sellable units: physical unchanged, reserved up → available down
      newReserved += absQty;
    } else if (type === 'RESERVATION_RELEASE') {
      // Free a hold: physical unchanged, reserved down → available up
      newReserved = Math.max(0, newReserved - absQty);
    } else if (type === 'CONSUME_RESERVATION') {
      // Reserved units leave the warehouse (paid sale): both physical and reserved down
      // → available stays the same (they were never sellable while reserved)
      newReserved = Math.max(0, newReserved - absQty);
      newPhysical -= absQty;
    } else {
      // Standard physical movement (sale, return, receipt, transfer, adjustment, etc.)
      newPhysical += quantityChange;
    }

    // Single source of truth for the Disponible column
    const newAvailable = newPhysical - newReserved;

    const affectsSellable =
      type === 'RESERVATION' ||
      (type !== 'RESERVATION_RELEASE' && type !== 'CONSUME_RESERVATION' && quantityChange < 0);

    if (affectsSellable && newAvailable < 0) {
      const posSettings = await this.settingsService.getPosSettings();
      if (!posSettings.allowNegativeStock) {
        throw new BadRequestException(`Stock insuficiente para la variante ${variantId}.`);
      }
    }

    // Prisma upsert cannot use null in compound unique keys (variantId, warehouseId, batchId).
    if (stock) {
      return tx.stockLevel.update({
        where: { id: stock.id },
        data: {
          physicalQuantity: newPhysical,
          availableQuantity: newAvailable,
          reservedQuantity: newReserved,
        },
      });
    }

    return tx.stockLevel.create({
      data: {
        variantId,
        warehouseId,
        batchId: batchId || null,
        branchId: branchId || undefined,
        physicalQuantity: newPhysical,
        availableQuantity: newAvailable,
        reservedQuantity: newReserved,
      },
    });
  }

  async reserveStock(variantId: string, warehouseId: string, branchId: string, quantity: number, orderId: string, tx?: any) {
    const prismaClient = tx || this.prisma;
    let stock = await prismaClient.stockLevel.findFirst({
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

    // recordMovement may have created the StockLevel when allowNegativeStock is on
    if (!stock) {
      stock = await prismaClient.stockLevel.findFirst({
        where: { variantId, warehouseId },
        orderBy: { availableQuantity: 'desc' },
      });
    }
    if (!stock) {
      throw new BadRequestException(`No se pudo resolver el nivel de stock para la variante ${variantId}.`);
    }

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

  /**
   * Manual stock adjustment from the admin UI (ADD / SUBTRACT / SET).
   * SET targets physicalQuantity (counted units on shelf), consistent with processStockAudit.
   * ADD/SUBTRACT change physical + available by the same delta.
   */
  async adjustStock(dto: { variantId: string; warehouseId: string; quantity: number; type: 'ADD' | 'SUBTRACT' | 'SET'; reason: string }) {
    if (!dto.reason?.trim()) {
      throw new BadRequestException('El motivo del ajuste es obligatorio.');
    }
    if (dto.quantity < 0 || (dto.type !== 'SET' && dto.quantity <= 0)) {
      throw new BadRequestException('La cantidad del ajuste debe ser mayor a cero.');
    }
    if (!Number.isInteger(dto.quantity)) {
      throw new BadRequestException('La cantidad del ajuste debe ser un número entero.');
    }

    const warehouse = await this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!warehouse) {
      throw new BadRequestException('Depósito no encontrado.');
    }

    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant) {
      throw new BadRequestException('Variante no encontrada.');
    }

    // Aggregate across batches for the same variant+warehouse (UI adjusts at SKU/warehouse level).
    // Prefer the null-batch row as the adjustment target so deltas land on the default stock node.
    const stockRows = await this.prisma.stockLevel.findMany({
      where: { variantId: dto.variantId, warehouseId: dto.warehouseId },
    });
    const aggregatedPhysical = stockRows.reduce((sum, s) => sum + s.physicalQuantity, 0);
    const aggregatedReserved = stockRows.reduce((sum, s) => sum + s.reservedQuantity, 0);
    const aggregatedAvailable = aggregatedPhysical - aggregatedReserved;
    const primaryStock =
      stockRows.find((s) => s.batchId == null) ??
      stockRows.sort((a, b) => (b.physicalQuantity - b.reservedQuantity) - (a.physicalQuantity - a.reservedQuantity))[0] ??
      null;

    let diff = 0;
    if (dto.type === 'ADD') {
      diff = dto.quantity;
    } else if (dto.type === 'SUBTRACT') {
      if (dto.quantity > aggregatedAvailable) {
        const posSettings = await this.settingsService.getPosSettings();
        if (!posSettings.allowNegativeStock) {
          throw new BadRequestException(
            `Stock insuficiente. Disponible: ${aggregatedAvailable}, solicitado: ${dto.quantity}.`,
          );
        }
      }
      diff = -dto.quantity;
    } else if (dto.type === 'SET') {
      if (dto.quantity < aggregatedReserved) {
        throw new BadRequestException(
          `No se puede fijar el stock físico en ${dto.quantity}: hay ${aggregatedReserved} unidades reservadas.`,
        );
      }
      // Align with stock audit: SET compares against physical count on shelf
      diff = dto.quantity - aggregatedPhysical;
    }

    if (diff === 0) {
      return {
        ...(await this.enrichStockLevel(primaryStock, dto.variantId, dto.warehouseId, warehouse.branchId)),
        movementId: null as string | null,
      };
    }

    const movement = await this.recordMovement({
      variantId: dto.variantId,
      batchId: primaryStock?.batchId ?? null,
      sourceWarehouseId: diff < 0 ? dto.warehouseId : null,
      destinationWarehouseId: diff > 0 ? dto.warehouseId : null,
      branchId: primaryStock?.branchId || warehouse.branchId || null,
      type: 'ADJUSTMENT',
      quantity: Math.abs(diff),
      referenceId: dto.reason.trim(),
    });

    const updated = await this.prisma.stockLevel.findFirst({
      where: { variantId: dto.variantId, warehouseId: dto.warehouseId },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      ...(await this.enrichStockLevel(updated, dto.variantId, dto.warehouseId, warehouse.branchId)),
      movementId: movement.id as string | null,
    };
  }

  private async enrichStockLevel(
    stock: { id?: string; variantId: string; warehouseId: string; branchId?: string | null; physicalQuantity: number; reservedQuantity: number; availableQuantity: number; updatedAt?: Date } | null,
    variantId: string,
    warehouseId: string,
    branchId?: string | null,
  ) {
    const [variant, warehouse, branch] = await Promise.all([
      this.prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } }),
      this.prisma.warehouse.findUnique({ where: { id: warehouseId } }),
      branchId
        ? this.prisma.branch.findUnique({ where: { id: branchId } })
        : Promise.resolve(null),
    ]);

    const physical = stock?.physicalQuantity ?? 0;
    const reserved = stock?.reservedQuantity ?? 0;
    // Derive Disponible — never trust a drifted stored availableQuantity
    const available = physical - reserved;

    return {
      id: stock?.id || `${variantId}-${warehouseId}`,
      variantId,
      warehouseId,
      branchId: stock?.branchId || branchId || null,
      physicalQuantity: physical,
      reservedQuantity: reserved,
      availableQuantity: available,
      variantSku: variant?.sku || '',
      productName: variant?.product?.name || '',
      warehouseName: warehouse?.name || '',
      branchName: branch?.name || '',
      lastUpdated: stock?.updatedAt || new Date(),
    };
  }

  async getStockByVariant(variantId: string) {
    const rows = await this.prisma.stockLevel.findMany({
      where: { variantId },
      orderBy: { warehouseId: 'asc' },
    });
    if (rows.length === 0) return [];

    const warehouseIds = [...new Set(rows.map((r) => r.warehouseId))];
    const branchIds = [...new Set(rows.map((r) => r.branchId).filter(Boolean))] as string[];

    const [variant, warehouses, branches] = await Promise.all([
      this.prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } }),
      this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
      this.prisma.branch.findMany({ where: { id: { in: branchIds } } }),
    ]);

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    return rows.map((s) => {
      const warehouse = warehouseMap.get(s.warehouseId);
      const branch = s.branchId ? branchMap.get(s.branchId) : null;
      return {
        id: s.id,
        variantId: s.variantId,
        warehouseId: s.warehouseId,
        branchId: s.branchId,
        physicalQuantity: s.physicalQuantity,
        reservedQuantity: s.reservedQuantity,
        availableQuantity: s.physicalQuantity - s.reservedQuantity,
        variantSku: variant?.sku || '',
        productName: variant?.product?.name || '',
        warehouseName: warehouse?.name || '',
        branchName: branch?.name || '',
        lastUpdated: s.updatedAt,
      };
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
      // Always derive Disponible from the invariant to heal any historical drift
      const available = s.physicalQuantity - s.reservedQuantity;
      return {
        id: `${s.variantId}-${s.warehouseId}`,
        variantId: s.variantId,
        warehouseId: s.warehouseId,
        branchId: s.branchId,
        physicalQuantity: s.physicalQuantity,
        reservedQuantity: s.reservedQuantity,
        availableQuantity: available,
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

    // Map UI filter aliases (ADD/SUBTRACT/SET) to real ledger types
    if (query.type) {
      const typeMap: Record<string, string[]> = {
        ADD: ['ADD', 'GOODS_RECEIPT', 'SALE_RETURN', 'RETURN', 'TRANSFER_IN', 'RESERVATION_RELEASE'],
        SUBTRACT: ['SUBTRACT', 'SALE', 'SALE_EXIT', 'TRANSFER_OUT', 'SHRINKAGE', 'RESERVATION', 'CONSUME_RESERVATION'],
        SET: ['SET', 'ADJUSTMENT', 'STOCK_TAKE_ADJUSTMENT', 'POS_CORRECTION'],
      };
      where.type = { in: typeMap[query.type] || [query.type] };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.search) {
      const matchingVariants = await this.prisma.productVariant.findMany({
        where: {
          OR: [
            { sku: { contains: query.search, mode: 'insensitive' } },
            { product: { name: { contains: query.search, mode: 'insensitive' } } },
          ],
        },
        select: { id: true },
      });
      const variantIds = matchingVariants.map((v) => v.id);
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { variantId: { in: variantIds } },
            { referenceId: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (query.branchId) {
      const warehouses = await this.prisma.warehouse.findMany({
        where: { branchId: query.branchId },
        select: { id: true },
      });
      const whIds = warehouses.map((w) => w.id);
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { sourceWarehouseId: { in: whIds } },
            { destinationWarehouseId: { in: whIds } },
          ],
        },
      ];
    }

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
    const branchIds = [...new Set(warehouses.map((w) => w.branchId).filter(Boolean))];
    const branches = branchIds.length
      ? await this.prisma.branch.findMany({ where: { id: { in: branchIds } } })
      : [];
    const branchMap = new Map(branches.map((b) => [b.id, b]));

    const enriched = data.map(m => {
      const variant = variantMap.get(m.variantId);
      const sourceWarehouse = m.sourceWarehouseId ? warehouseMap.get(m.sourceWarehouseId) : null;
      const destinationWarehouse = m.destinationWarehouseId ? warehouseMap.get(m.destinationWarehouseId) : null;
      const primaryWarehouse = destinationWarehouse || sourceWarehouse;
      const branch = primaryWarehouse?.branchId ? branchMap.get(primaryWarehouse.branchId) : null;
      return {
        ...m,
        variantSku: variant?.sku || '',
        productName: variant?.product?.name || '',
        sourceWarehouseName: sourceWarehouse?.name || '',
        destinationWarehouseName: destinationWarehouse?.name || '',
        warehouseName: primaryWarehouse?.name || '',
        branchName: branch?.name || '',
        branchId: primaryWarehouse?.branchId || null,
        reason: m.type === 'ADJUSTMENT' || m.type === 'STOCK_TAKE_ADJUSTMENT' ? m.referenceId : null,
        referenceType: m.type,
      };
    });

    return { data: enriched, total, page, pageSize };
  }

  async findMovementById(id: string) {
    const movement = await this.prisma.inventoryMovement.findUnique({ where: { id } });
    if (!movement) {
      throw new BadRequestException('Movimiento no encontrado.');
    }

    const warehouseIds = [movement.sourceWarehouseId, movement.destinationWarehouseId].filter(Boolean) as string[];
    const [variant, warehouses] = await Promise.all([
      this.prisma.productVariant.findUnique({
        where: { id: movement.variantId },
        include: { product: true },
      }),
      this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
    ]);

    const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));
    const sourceWarehouse = movement.sourceWarehouseId ? warehouseMap.get(movement.sourceWarehouseId) : null;
    const destinationWarehouse = movement.destinationWarehouseId
      ? warehouseMap.get(movement.destinationWarehouseId)
      : null;
    const primaryWarehouse = destinationWarehouse || sourceWarehouse;
    const branch = primaryWarehouse?.branchId
      ? await this.prisma.branch.findUnique({ where: { id: primaryWarehouse.branchId } })
      : null;

    return {
      ...movement,
      variantSku: variant?.sku || '',
      productName: variant?.product?.name || '',
      sourceWarehouseName: sourceWarehouse?.name || '',
      destinationWarehouseName: destinationWarehouse?.name || '',
      warehouseName: primaryWarehouse?.name || '',
      branchName: branch?.name || '',
      branchId: primaryWarehouse?.branchId || null,
      reason: movement.type === 'ADJUSTMENT' || movement.type === 'STOCK_TAKE_ADJUSTMENT' ? movement.referenceId : null,
      referenceType: movement.type,
    };
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

  async findReservations(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    branchId?: string;
  }) {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 15;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search?.trim()) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { orderId: { contains: filters.search, mode: 'insensitive' } },
        { variantId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.stockReservation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockReservation.count({ where }),
    ]);

    const variantIds = [...new Set(data.map(r => r.variantId))];
    const warehouseIds = [...new Set(data.map(r => r.warehouseId))];
    const [variants, warehouses] = await Promise.all([
      this.prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      }),
      this.prisma.warehouse.findMany({ where: { id: { in: warehouseIds } } }),
    ]);
    const variantMap = new Map(variants.map(v => [v.id, v]));
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));

    return {
      data: data.map(r =>
        this.mapStockReservation(r, variantMap.get(r.variantId), {
          branchId: warehouseMap.get(r.warehouseId)?.branchId,
        }),
      ),
      total,
      page,
      pageSize,
    };
  }

  async findReservationById(id: string) {
    const reservation = await this.prisma.stockReservation.findUnique({ where: { id } });
    if (!reservation) throw new BadRequestException('Reserva no encontrada');

    const [variant, warehouse] = await Promise.all([
      this.prisma.productVariant.findUnique({
        where: { id: reservation.variantId },
        include: { product: true },
      }),
      this.prisma.warehouse.findUnique({ where: { id: reservation.warehouseId } }),
    ]);

    return this.mapStockReservation(reservation, variant, { branchId: warehouse?.branchId });
  }

  async createManualReservation(dto: {
    branchId: string;
    customerId?: string;
    expiresAt: string;
    notes?: string;
    lines: { variantId: string; quantity: number }[];
  }) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { branchId: dto.branchId },
      orderBy: { createdAt: 'asc' },
    });
    if (!warehouse) {
      throw new BadRequestException('No hay depósito configurado para la sucursal indicada');
    }

    const groupId = crypto.randomUUID();
    const orderId = `MANUAL-RES-${groupId}`;
    const expiresAt = new Date(dto.expiresAt);

    const created = await this.prisma.$transaction(async (tx) => {
      const reservations = [];
      for (const line of dto.lines) {
        await this.reserveStock(
          line.variantId,
          warehouse.id,
          dto.branchId,
          line.quantity,
          orderId,
          tx,
        );

        const reservation = await tx.stockReservation.findFirst({
          where: { orderId, variantId: line.variantId, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
        });

        if (reservation) {
          await tx.stockReservation.update({
            where: { id: reservation.id },
            data: { expiresAt },
          });
          reservations.push(reservation);
        }
      }
      return reservations;
    });

    if (!created.length) {
      throw new BadRequestException('No se pudo crear la reserva de stock');
    }

    return this.mapStockReservation(
      { ...created[0], expiresAt },
      await this.prisma.productVariant.findUnique({
        where: { id: created[0].variantId },
        include: { product: true },
      }),
      { branchId: dto.branchId, customerId: dto.customerId, notes: dto.notes },
    );
  }

  async consumeReservationById(id: string, saleOrderId?: string) {
    const reservation = await this.prisma.stockReservation.findUnique({ where: { id } });
    if (!reservation) throw new BadRequestException('Reserva no encontrada');
    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException('Solo se pueden consumir reservas activas');
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: reservation.warehouseId },
    });
    const branchId = warehouse?.branchId;
    if (!branchId) throw new BadRequestException('Depósito de la reserva no encontrado');

    const orderId = saleOrderId || reservation.orderId || reservation.id;
    await this.consumeReservation(
      reservation.variantId,
      reservation.warehouseId,
      branchId,
      reservation.quantity,
      orderId,
    );

    const updated = await this.prisma.stockReservation.findUnique({ where: { id } });
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: reservation.variantId },
      include: { product: true },
    });
    return this.mapStockReservation(updated!, variant);
  }

  async releaseReservationById(id: string) {
    const reservation = await this.prisma.stockReservation.findUnique({ where: { id } });
    if (!reservation) throw new BadRequestException('Reserva no encontrada');
    if (reservation.status !== 'ACTIVE') {
      throw new BadRequestException('Solo se pueden liberar reservas activas');
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: reservation.warehouseId },
    });
    const branchId = warehouse?.branchId;
    if (!branchId) throw new BadRequestException('Depósito de la reserva no encontrado');

    await this.releaseReservation(
      reservation.variantId,
      reservation.warehouseId,
      branchId,
      reservation.quantity,
      reservation.orderId || reservation.id,
    );

    const updated = await this.prisma.stockReservation.findUnique({ where: { id } });
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: reservation.variantId },
      include: { product: true },
    });
    return this.mapStockReservation(updated!, variant);
  }

  private mapStockReservation(
    reservation: any,
    variant?: any,
    meta?: { branchId?: string; customerId?: string; notes?: string },
  ) {
    const productName = variant?.product?.name;
    const sku = variant?.sku;
    return {
      id: reservation.id,
      branchId: meta?.branchId ?? '',
      customerId: meta?.customerId,
      status: reservation.status,
      lines: [
        {
          variantId: reservation.variantId,
          quantity: reservation.quantity,
          sku,
          productName,
        },
      ],
      expiresAt: reservation.expiresAt.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      notes: meta?.notes,
    };
  }
}

