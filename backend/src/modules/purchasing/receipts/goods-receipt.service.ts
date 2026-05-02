import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PurchasingService } from '../purchasing.service';
import { StockMovementService } from '../../inventory/stock-movement.service';

@Injectable()
export class GoodsReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchasingService: PurchasingService,
    private readonly stockMovementService: StockMovementService
  ) {}

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.goodsReceipt.findMany({
        include: { lines: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.goodsReceipt.count(),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    return this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  /**
   * 1. Draft a Goods Receipt based on what was physically scanned.
   */
  async draftReceipt(payload: {
    purchaseOrderId: string;
    receivedByUserId?: string;
    scannedItems: { poLineItemId: string, variantId: string, quantity: number }[];
    notes?: string;
  }) {
    const po = await this.purchasingService.getPO(payload.purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase Order not found');

    let hasDifferences = false;
    const lineData = [];

    for (const scan of payload.scannedItems) {
      const poLine = po.lines.find(l => l.id === scan.poLineItemId);
      if (!poLine) throw new BadRequestException(`Line item ${scan.poLineItemId} does not belong to PO ${po.id}`);

      const expected = poLine.orderedQuantity - poLine.receivedQuantity;
      const difference = scan.quantity - expected;

      if (difference !== 0) hasDifferences = true;

      lineData.push({
        poLineItemId: scan.poLineItemId,
        variantId: scan.variantId,
        expectedQuantity: expected,
        receivedQuantity: scan.quantity,
        difference,
        notes: difference > 0 ? 'Overshipment' : (difference < 0 ? 'Short shipment' : undefined),
      });
    }

    return this.prisma.goodsReceipt.create({
      data: {
        purchaseOrderId: po.id,
        destinationWarehouseId: po.destinationWarehouseId,
        receivedByUserId: payload.receivedByUserId,
        status: hasDifferences ? 'DISPUTED' : 'DRAFT',
        notes: payload.notes,
        lines: {
          create: lineData
        }
      },
      include: { lines: true }
    });
  }

  /**
   * 2. Validate and Commit the Receipt.
   * This pushes the physical goods into the Inventory Ledger.
   */
  async validateReceipt(receiptId: string, branchId: string, approvedByUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({
        where: { id: receiptId },
        include: { lines: { include: { poLineItem: true } } }
      });

      if (!receipt) throw new NotFoundException('Goods Receipt not found');
      if (receipt.status === 'VALIDATED') throw new ConflictException('Already validated');

      if (receipt.status === 'DISPUTED' && !approvedByUserId) {
        throw new BadRequestException('Disputed receipt requires manager approval');
      }

      // Load Stock
      for (const line of receipt.lines) {
        await this.stockMovementService.processGoodsReceipt({
          variantId: line.variantId,
          destinationWarehouseId: receipt.destinationWarehouseId,
          branchId: branchId,
          quantity: line.receivedQuantity,
          purchaseCost: line.poLineItem.unitCost,
          purchaseOrderId: receipt.purchaseOrderId,
        });

        // Update PO Line received quantity
        await tx.pOLineItem.update({
          where: { id: line.poLineItemId },
          data: { receivedQuantity: { increment: line.receivedQuantity } }
        });
      }

      // Update PO Status if fully received
      const updatedPo = await tx.purchaseOrder.findUnique({
        where: { id: receipt.purchaseOrderId },
        include: { lines: true }
      });
      const allFullyReceived = updatedPo.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
      
      await tx.purchaseOrder.update({
        where: { id: receipt.purchaseOrderId },
        data: { 
          status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
          completedAt: allFullyReceived ? new Date() : undefined
        }
      });

      return tx.goodsReceipt.update({
        where: { id: receiptId },
        data: { 
          status: 'VALIDATED',
          receivedByUserId: approvedByUserId || receipt.receivedByUserId
        },
        include: { lines: true }
      });
    });
  }
}
