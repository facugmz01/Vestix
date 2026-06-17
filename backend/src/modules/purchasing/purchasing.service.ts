import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreatePurchaseOrderDto } from './dto/create-po.dto';
import { ReceiveGoodsDto } from './dto/receive-goods.dto';
import { MovementType } from '../inventory/enums/movement-type.enum';

@Injectable()
export class PurchasingService {
  constructor(
    public prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async createPurchaseOrder(dto: CreatePurchaseOrderDto) {
    let totalAmount = 0;
    const lines = dto.lines.map(line => {
      const lineTotal = line.orderedQuantity * line.unitCost;
      totalAmount += lineTotal;
      return {
        variantId: line.variantId,
        orderedQuantity: line.orderedQuantity,
        unitCost: line.unitCost,
        totalAmount: lineTotal,
      };
    });

    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        destinationWarehouseId: dto.destinationWarehouseId,
        status: 'ISSUED',
        totalAmount,
        notes: dto.notes,
        lines: {
          create: lines,
        },
      },
    });
  }

  async receiveGoods(dto: ReceiveGoodsDto) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: { lines: true },
      });

      if (!po) throw new BadRequestException('Purchase Order not found');
      if (po.status === 'COMPLETED') throw new BadRequestException('Purchase Order is already completed');

      // 1. Create Goods Receipt Document
      const receiptLines = dto.lines.map(line => {
        const poLine = po.lines.find(l => l.variantId === line.variantId);
        return {
          variantId: line.variantId,
          poLineItemId: poLine?.id,
          expectedQuantity: poLine ? (poLine.orderedQuantity - poLine.receivedQuantity) : 0,
          receivedQuantity: line.receivedQuantity,
        };
      });

      // Find valid PO Lines to link against
      const validReceiptLines = receiptLines.filter(l => l.poLineItemId);

      const receipt = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: po.id,
          destinationWarehouseId: po.destinationWarehouseId,
          status: 'VALIDATED',
          notes: dto.notes,
          lines: {
            create: validReceiptLines.map(l => ({
              poLineItemId: l.poLineItemId!,
              variantId: l.variantId,
              expectedQuantity: l.expectedQuantity,
              receivedQuantity: l.receivedQuantity,
              difference: l.receivedQuantity - l.expectedQuantity,
            })),
          },
        },
      });

      // 2. Update PO Lines received quantity
      let allReceived = true;
      for (const line of po.lines) {
        const receivedInThisBatch = dto.lines.find(l => l.variantId === line.variantId)?.receivedQuantity || 0;
        const newReceivedTotal = line.receivedQuantity + receivedInThisBatch;
        
        if (receivedInThisBatch > 0) {
          await tx.pOLineItem.update({
            where: { id: line.id },
            data: { receivedQuantity: newReceivedTotal },
          });
        }

        if (newReceivedTotal < line.orderedQuantity) {
          allReceived = false;
        }
      }

      // Update PO Status
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: allReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
        },
      });

      // 3. Atomically Increment Inventory via InventoryService
      for (const line of validReceiptLines) {
        const poLine = po.lines.find(l => l.id === line.poLineItemId);
        await this.inventoryService.recordMovement(
          {
            variantId: line.variantId,
            quantity: line.receivedQuantity,
            type: MovementType.GOODS_RECEIPT,
            destinationWarehouseId: po.destinationWarehouseId,
            unitCost: poLine?.unitCost || 0,
            referenceId: receipt.id,
          },
          tx,
        );
      }

      return receipt;
    });
  }

  async findAllOrders(filters: any) {
    const { page = 1, pageSize = 15, search, status, supplierId } = filters;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (search) where.id = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { supplier: true },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOneOrder(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        lines: {
          include: { variant: { include: { product: true } } },
        },
      },
    });
  }

  async findAllReceipts(filters: any) {
    const { page = 1, pageSize = 15, search, status } = filters;
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (search) where.id = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { lines: true },
      }),
      this.prisma.goodsReceipt.count({ where }),
    ]);

    return { data, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOneReceipt(id: string) {
    return this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        lines: {
          include: { variant: { include: { product: true } } },
        },
      },
    });
  }
}
