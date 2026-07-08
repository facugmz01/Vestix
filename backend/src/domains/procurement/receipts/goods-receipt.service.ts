import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { PurchasingService } from '../purchasing.service';
import { StockMovementService } from '../../logistics/stock-movement.service';
import { NotificationTriggersService } from '../../notifications/notification-triggers.service';

@Injectable()
export class GoodsReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchasingService: PurchasingService,
    private readonly stockMovementService: StockMovementService,
    private readonly notificationTriggers: NotificationTriggersService,
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
    scannedItems: { poLineItemId: string, variantId: string, quantity: number, batchLot?: string, batchExpirationDate?: string }[];
    notes?: string;
  }) {
    const po = await this.purchasingService.getPO(payload.purchaseOrderId);
    if (!po) throw new NotFoundException('Purchase Order not found');
    if (po.status !== 'ISSUED' && po.status !== 'PARTIALLY_RECEIVED') {
      throw new BadRequestException(`La orden está en estado ${po.status} y no puede recibir mercadería`);
    }

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
        batchLot: scan.batchLot,
        batchExpirationDate: scan.batchExpirationDate ? new Date(scan.batchExpirationDate) : undefined,
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
   * Quick receive: draft + validate in one step (used from PO detail drawer).
   */
  async quickReceiveFromPO(
    poId: string,
    lines: { variantId: string; receivedQuantity: number }[],
    userId?: string,
  ) {
    const po = await this.purchasingService.getPO(poId);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'ISSUED' && po.status !== 'PARTIALLY_RECEIVED') {
      throw new BadRequestException(`La orden está en estado ${po.status} y no puede recibir mercadería`);
    }

    const scannedItems = lines
      .filter((l) => l.receivedQuantity > 0)
      .map((l) => {
        const poLine = po.lines.find((pl) => pl.variantId === l.variantId);
        if (!poLine) {
          throw new BadRequestException(`La variante ${l.variantId} no pertenece a la orden`);
        }
        return {
          poLineItemId: poLine.id,
          variantId: l.variantId,
          quantity: l.receivedQuantity,
        };
      });

    if (scannedItems.length === 0) {
      throw new BadRequestException('Indicá al menos un artículo con cantidad mayor a cero');
    }

    const receipt = await this.draftReceipt({
      purchaseOrderId: poId,
      receivedByUserId: userId,
      scannedItems,
    });

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: po.destinationWarehouseId },
    });

    return this.validateReceipt(receipt.id, warehouse?.branchId, userId);
  }

  /**
   * 2. Validate and Commit the Receipt.
   * This pushes the physical goods into the Inventory Ledger.
   */
  async validateReceipt(receiptId: string, branchId?: string, approvedByUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({
        where: { id: receiptId },
        include: { lines: { include: { poLineItem: true } }, purchaseOrder: true }
      });

      if (!receipt) throw new NotFoundException('Goods Receipt not found');
      if (receipt.status === 'VALIDATED') throw new ConflictException('Already validated');

      let resolvedBranchId = branchId;
      if (!resolvedBranchId) {
        const warehouse = await tx.warehouse.findUnique({
          where: { id: receipt.destinationWarehouseId },
        });
        resolvedBranchId = warehouse?.branchId;
      }
      if (!resolvedBranchId) {
        throw new BadRequestException('No se pudo determinar la sucursal del depósito de destino');
      }

      if (receipt.status === 'DISPUTED' && !approvedByUserId) {
        throw new BadRequestException('Disputed receipt requires manager approval');
      }

      // Load Stock
      for (const line of receipt.lines) {
        let batchId = undefined;

        if (line.batchLot) {
          // Verify or create ProductBatch
          let batch = await tx.productBatch.findFirst({
            where: {
              variantId: line.variantId,
              batchNumber: line.batchLot
            }
          });

          if (!batch) {
            batch = await tx.productBatch.create({
              data: {
                variantId: line.variantId,
                batchNumber: line.batchLot,
                expirationDate: line.batchExpirationDate,
                manufacturingDate: new Date(),
                supplierId: receipt.purchaseOrder?.supplierId // Opcional, pero util si se expone en la carga
              }
            });
          }
          batchId = batch.id;
        }

        await this.stockMovementService.processGoodsReceipt({
          variantId: line.variantId,
          destinationWarehouseId: receipt.destinationWarehouseId,
          branchId: resolvedBranchId,
          quantity: line.receivedQuantity,
          purchaseCost: line.poLineItem.unitCost,
          purchaseOrderId: receipt.purchaseOrderId,
          batchId: batchId
        }, tx);

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
    }).then(async (validated) => {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: validated.destinationWarehouseId },
      });
      const branch = warehouse?.branchId
        ? await this.prisma.branch.findUnique({ where: { id: warehouse.branchId } })
        : null;
      void this.notificationTriggers.onGoodsReceiptReceived(receiptId, branch?.name || 'Sucursal');
      return validated;
    });
  }
}
