import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateTransferDto, ReceiveTransferDto } from './dto/transfer.dto';
import { MovementType } from '../inventory/enums/movement-type.enum';

@Injectable()
export class TransfersService {
  constructor(
    public prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async createTransfer(dto: CreateTransferDto, userId: string) {
    if (dto.sourceWarehouseId === dto.destinationWarehouseId) {
      throw new BadRequestException('Source and destination cannot be the same');
    }

    return this.prisma.stockTransfer.create({
      data: {
        sourceWarehouseId: dto.sourceWarehouseId,
        destinationWarehouseId: dto.destinationWarehouseId,
        status: 'DRAFT',
        notes: dto.notes,
        requestedByUserId: userId,
        lines: {
          create: dto.lines.map(line => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
        },
      },
    });
  }

  async dispatchTransfer(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { lines: true },
      });

      if (!transfer) throw new BadRequestException('Transfer not found');
      if (transfer.status !== 'DRAFT') throw new BadRequestException(`Cannot dispatch transfer in status ${transfer.status}`);

      // 1. Mark as IN_TRANSIT
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'IN_TRANSIT',
          dispatchedAt: new Date(),
        },
      });

      // 2. Deduct from Source Warehouse atomically
      for (const line of transfer.lines) {
        // Find cost from variant
        const variant = await tx.productVariant.findUnique({ where: { id: line.variantId } });

        await this.inventoryService.recordMovement(
          {
            variantId: line.variantId,
            quantity: line.quantity,
            type: MovementType.TRANSFER_OUT,
            sourceWarehouseId: transfer.sourceWarehouseId,
            destinationWarehouseId: transfer.destinationWarehouseId, // Tracking intent
            unitCost: variant?.costPrice || 0,
            referenceId: transfer.id,
          },
          tx,
        );
      }

      return updatedTransfer;
    });
  }

  async receiveTransfer(id: string, dto: ReceiveTransferDto) {
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id },
        include: { lines: true },
      });

      if (!transfer) throw new BadRequestException('Transfer not found');
      if (transfer.status !== 'IN_TRANSIT') throw new BadRequestException(`Cannot receive transfer in status ${transfer.status}`);

      // 1. Mark as COMPLETED and update received quantities
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          receivedAt: new Date(),
        },
      });

      // 2. Increment Destination Warehouse atomically
      for (const receivedLine of dto.lines) {
        const transferLine = transfer.lines.find(l => l.variantId === receivedLine.variantId);
        if (!transferLine) continue;

        // Update line with received quantity
        await tx.stockTransferLine.update({
          where: { id: transferLine.id },
          data: { receivedQuantity: receivedLine.receivedQuantity },
        });

        if (receivedLine.receivedQuantity > 0) {
          const variant = await tx.productVariant.findUnique({ where: { id: receivedLine.variantId } });

          await this.inventoryService.recordMovement(
            {
              variantId: receivedLine.variantId,
              quantity: receivedLine.receivedQuantity,
              type: MovementType.TRANSFER_IN,
              sourceWarehouseId: transfer.sourceWarehouseId, // Tracking origin
              destinationWarehouseId: transfer.destinationWarehouseId,
              unitCost: variant?.costPrice || 0,
              referenceId: transfer.id,
            },
            tx,
          );
        }
      }

      return transfer;
    });
  }

  async findAll(filters: any) {
    const { page = 1, pageSize = 15, search, status } = filters;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (search) where.id = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    // Enhance with names if needed (UI needs warehouse names)
    // As a shortcut we can fetch warehouse names or just let UI handle
    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!transfer) return null;

    const variantIds = transfer.lines.map(l => l.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    return {
      ...transfer,
      lines: transfer.lines.map(l => ({
        ...l,
        variant: variantMap.get(l.variantId) || null
      }))
    };
  }
}
