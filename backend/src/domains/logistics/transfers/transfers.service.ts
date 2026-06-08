import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { InventoryService } from '../inventory.service';
import { MovementType } from '../models/inventory-movement.model';
import { TransferStatus, TransferLine } from './models/transfer.model';

@Injectable()
export class TransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryLedger: InventoryService,
  ) {}

  /**
   * 1. CREATE: Drafts a transfer and validates physical feasibility.
   */
  async createTransfer(data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    lines: TransferLine[];
  }) {
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be distinct.');
    }

    // PRE-VALIDATION: Ensure source actually has the requested items before allowing a draft
    for (const line of data.lines) {
      const stockArr = await this.inventoryLedger.getStockPerWarehouse(data.sourceWarehouseId, line.variantId);
      const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
      
      if (available < line.quantity) {
        throw new BadRequestException(`Insufficient available stock for variant ${line.variantId} in the source warehouse.`);
      }
    }

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        status: TransferStatus.DRAFT,
        lines: {
          create: data.lines.map(line => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
        },
      },
      include: {
        lines: {
          include: {
            variant: true,
          },
        },
      },
    });

    return transfer;
  }

  /**
   * 2. DISPATCH: The truck leaves. Goods are physically removed from the source building.
   */
  async dispatchTransfer(transferId: string, options?: { trackingNumber?: string }) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { lines: true },
    });

    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT transfers can be dispatched.');
    }

    // Execute TRANSFER_OUT movements against the ledger
    for (const line of transfer.lines) {
      // STRICT CONCURRENCY CHECK: Re-verify stock right before dispatch
      const stockArr = await this.inventoryLedger.getStockPerWarehouse(transfer.sourceWarehouseId, line.variantId);
      const available = stockArr.length > 0 ? stockArr[0].availableQuantity : 0;
      
      if (available < line.quantity) {
        throw new BadRequestException(`Dispatch Failed: Stock for variant ${line.variantId} was consumed by a sale before dispatch.`);
      }

      await this.inventoryLedger.recordMovement({
        variantId: line.variantId,
        sourceWarehouseId: transfer.sourceWarehouseId,
        destinationWarehouseId: null, // Leaves physical source warehouse into Transit
        branchId: null, 
        type: MovementType.TRANSFER_OUT,
        quantity: line.quantity,
        referenceId: `TRF-${transfer.id}`,
      });
    }

    return this.prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.IN_TRANSIT,
        trackingNumber: options?.trackingNumber || null,
        dispatchedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            variant: true,
          },
        },
      },
    });
  }

  /**
   * 3. RECEIVE: The truck arrives. Goods enter the destination building.
   */
  async receiveTransfer(transferId: string, data: { lines: { variantId: string; receivedQuantity: number }[] }) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id: transferId },
      include: { lines: true },
    });

    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('Only IN_TRANSIT transfers can be received.');
    }

    // Retrieve the destination warehouse's branch ID
    const destWarehouse = await this.prisma.warehouse.findUnique({
      where: { id: transfer.destinationWarehouseId },
    });
    if (!destWarehouse) throw new NotFoundException('Destination warehouse not found');
    const destinationBranchId = destWarehouse.branchId;

    // Execute TRANSFER_IN movements against the ledger
    for (const item of data.lines) {
      await this.inventoryLedger.recordMovement({
        variantId: item.variantId,
        sourceWarehouseId: null, // Arriving from transit
        destinationWarehouseId: transfer.destinationWarehouseId,
        branchId: destinationBranchId,
        type: MovementType.TRANSFER_IN,
        quantity: item.receivedQuantity,
        referenceId: `TRF-${transfer.id}`,
      });

      // Update the line with received quantity
      const line = transfer.lines.find(l => l.variantId === item.variantId);
      if (line) {
        await this.prisma.stockTransferLine.update({
          where: { id: line.id },
          data: { receivedQuantity: item.receivedQuantity },
        });
      }
    }

    return this.prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.COMPLETED,
        receivedAt: new Date(),
      },
      include: {
        lines: {
          include: {
            variant: true,
          },
        },
      },
    });
  }

  /**
   * 4. CANCEL: Aborts a request before it leaves the building.
   */
  async cancelTransfer(transferId: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('Cannot cancel a transfer that is already dispatched. File a return or shrinkage instead.');
    }

    return this.prisma.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.CANCELLED,
      },
    });
  }

  /**
   * 5. GET ALL (PAGINATED & FILTERED)
   */
  async findAll(query: { page?: number; pageSize?: number; status?: string; search?: string }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 15;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { trackingNumber: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          sourceWarehouse: true,
          destinationWarehouse: true,
          lines: {
            include: {
              variant: true,
            },
          },
        },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    const formattedData = data.map(t => ({
      ...t,
      sourceWarehouseName: t.sourceWarehouse?.name,
      destinationWarehouseName: t.destinationWarehouse?.name,
    }));

    return { data: formattedData, total };
  }

  /**
   * 6. GET ONE
   */
  async findOne(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        destinationWarehouse: true,
        lines: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!transfer) throw new NotFoundException('Transfer not found');

    return {
      ...transfer,
      sourceWarehouseName: transfer.sourceWarehouse?.name,
      destinationWarehouseName: transfer.destinationWarehouse?.name,
    };
  }
}
