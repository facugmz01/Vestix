import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RecordMovementDto } from './dto/record-movement.dto';
import { MovementType } from './enums/movement-type.enum';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Records an inventory movement and updates the StockLevel atomically.
   */
  async recordMovement(dto: RecordMovementDto, externalTx?: any) {
    const execute = async (tx: any) => {
      // 1. Validate logic based on movement type
      this.validateMovementLogic(dto);

      // 2. Insert the immutable movement record
      const movement = await tx.inventoryMovement.create({
        data: {
          variantId: dto.variantId,
          type: dto.type,
          quantity: dto.quantity,
          unitCost: dto.unitCost || 0,
          sourceWarehouseId: dto.sourceWarehouseId,
          destinationWarehouseId: dto.destinationWarehouseId,
          referenceId: dto.referenceId,
          batchId: dto.batchId,
        },
      });

      // 3. Update stock levels
      if (dto.sourceWarehouseId) {
        await this.decrementStock(
          tx,
          dto.variantId,
          dto.sourceWarehouseId,
          dto.quantity,
          dto.batchId,
        );
      }

      if (dto.destinationWarehouseId) {
        await this.incrementStock(
          tx,
          dto.variantId,
          dto.destinationWarehouseId,
          dto.quantity,
          dto.batchId,
        );
      }

      return movement;
    };

    if (externalTx) {
      return execute(externalTx);
    } else {
      return this.prisma.$transaction(execute);
    }
  }

  private validateMovementLogic(dto: RecordMovementDto) {
    if (
      [MovementType.SALE, MovementType.TRANSFER_OUT, MovementType.SHRINKAGE].includes(
        dto.type,
      ) &&
      !dto.sourceWarehouseId
    ) {
      throw new BadRequestException(`Source warehouse is required for ${dto.type}`);
    }

    if (
      [
        MovementType.GOODS_RECEIPT,
        MovementType.SALE_RETURN,
        MovementType.TRANSFER_IN,
        MovementType.POS_CORRECTION,
      ].includes(dto.type) &&
      !dto.destinationWarehouseId
    ) {
      throw new BadRequestException(`Destination warehouse is required for ${dto.type}`);
    }
  }

  private async incrementStock(
    tx: any, // Prisma.TransactionClient
    variantId: string,
    warehouseId: string,
    quantity: number,
    batchId?: string,
  ) {
    // Upsert equivalent using standard Prisma functions to handle dynamic creation
    const existing = await tx.stockLevel.findUnique({
      where: {
        variantId_warehouseId_batchId: {
          variantId,
          warehouseId,
          batchId: batchId || '', // Prisma doesn't allow nullable in unique constraints cleanly without coalesce logic, but for simplicity assuming '' or null handler
        },
      },
    });

    // In Prisma schema, batchId is optional, so we need to query carefully.
    // The schema has @@unique([variantId, warehouseId, batchId]) but batchId can be null.
    // Prisma unique index with nulls can be tricky. Let's use findFirst since batchId might be null.
    const stock = await tx.stockLevel.findFirst({
      where: {
        variantId,
        warehouseId,
        batchId: batchId || null,
      },
    });

    if (stock) {
      await tx.stockLevel.update({
        where: { id: stock.id },
        data: {
          physicalQuantity: { increment: quantity },
          availableQuantity: { increment: quantity },
        },
      });
    } else {
      await tx.stockLevel.create({
        data: {
          variantId,
          warehouseId,
          batchId: batchId || null,
          physicalQuantity: quantity,
          availableQuantity: quantity,
        },
      });
    }
  }

  private async decrementStock(
    tx: any,
    variantId: string,
    warehouseId: string,
    quantity: number,
    batchId?: string,
  ) {
    const stock = await tx.stockLevel.findFirst({
      where: {
        variantId,
        warehouseId,
        batchId: batchId || null,
      },
    });

    if (!stock || stock.physicalQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for variant ${variantId} in warehouse ${warehouseId}`,
      );
    }

    await tx.stockLevel.update({
      where: { id: stock.id },
      data: {
        physicalQuantity: { decrement: quantity },
        availableQuantity: { decrement: quantity },
      },
    });
  }
}
