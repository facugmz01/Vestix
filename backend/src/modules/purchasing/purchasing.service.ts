import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StockMovementService } from '../inventory/stock-movement.service';

@Injectable()
export class PurchasingService {
  private readonly logger = new Logger(PurchasingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService
  ) {}

  async createPO(dto: any) {
    try {
      const totalAmount = (dto.lines || []).reduce((sum, l) => sum + (l.orderedQuantity * l.unitCost), 0);

      return await this.prisma.purchaseOrder.create({
        data: {
          supplierId: dto.supplierId,
          destinationWarehouseId: dto.destinationWarehouseId,
          status: 'DRAFT',
          totalAmount: totalAmount,
          paidAmount: 0,
          currency: dto.currency || 'ARS',
          notes: dto.notes,
          lines: {
            create: (dto.lines || []).map(l => ({
              variantId: l.variantId,
              orderedQuantity: l.orderedQuantity,
              unitCost: l.unitCost,
              totalAmount: l.orderedQuantity * l.unitCost
            }))
          }
        },
        include: { lines: true }
      });
    } catch (error: any) {
      this.logger.error(`Error creating PO: ${error.message}`, error.stack);
      throw new BadRequestException('Error al crear la orden de compra. Verificá los datos o sincronizá la base de datos.');
    }
  }

  async processDirectPurchase(dto: {
    supplierId: string;
    warehouseId: string;
    branchId: string;
    paymentAccountId?: string;
    paymentAmount?: number;
    lines: {
      variantId: string;
      quantity: number;
      unitCost: number;
      discountAmount?: number;
    }[];
    notes?: string;
  }) {
    const totalAmount = dto.lines.reduce((sum, l) => sum + (l.quantity * l.unitCost) - (l.discountAmount || 0), 0);
    const paidAmount = dto.paymentAmount || 0;

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          supplierId: dto.supplierId,
          destinationWarehouseId: dto.warehouseId,
          status: 'COMPLETED',
          totalAmount,
          paidAmount,
          completedAt: new Date(),
          notes: dto.notes,
          lines: {
            create: dto.lines.map(l => ({
              variantId: l.variantId,
              orderedQuantity: l.quantity,
              receivedQuantity: l.quantity,
              unitCost: l.unitCost,
              discountAmount: l.discountAmount || 0,
              totalAmount: (l.quantity * l.unitCost) - (l.discountAmount || 0)
            }))
          }
        },
        include: { lines: true }
      });

      for (const line of dto.lines) {
        await this.stockMovementService.processGoodsReceipt({
          variantId: line.variantId,
          destinationWarehouseId: dto.warehouseId,
          branchId: dto.branchId,
          quantity: line.quantity,
          purchaseCost: line.unitCost,
          purchaseOrderId: po.id
        });
      }

      const remainingDebt = totalAmount - paidAmount;
      await tx.supplier.update({
        where: { id: dto.supplierId },
        data: { balance: { increment: remainingDebt } }
      });

      if (paidAmount > 0 && dto.paymentAccountId) {
        await tx.financialTransaction.create({
          data: {
            accountId: dto.paymentAccountId,
            type: 'CREDIT',
            amount: paidAmount,
            referenceId: po.id,
            description: `Pago a proveedor por compra ${po.id}`
          }
        });

        await tx.financialAccount.update({
          where: { id: dto.paymentAccountId },
          data: { balance: { decrement: paidAmount } }
        });
      }

      return po;
    });
  }

  async findAll(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 50;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        include: { supplier: true, lines: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.purchaseOrder.count(),
    ]);

    return { data, total, page, pageSize };
  }

  async getPO(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true }
    });
  }

  async applyReceiptToPO(poId: string, receiptLines: { poLineItemId: string, receivedQuantity: number }[]) {
    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { lines: true }
      });
      if (!po) return;

      for (const receipt of receiptLines) {
        await tx.pOLineItem.update({
          where: { id: receipt.poLineItemId },
          data: { receivedQuantity: { increment: receipt.receivedQuantity } }
        });
      }

      const updatedPo = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { lines: true }
      });

      const allFullyReceived = updatedPo.lines.every(l => l.receivedQuantity >= l.orderedQuantity);
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { 
          status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED',
          completedAt: allFullyReceived ? new Date() : undefined
        }
      });
    });
  }

  async updatePO(id: string, dto: any) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'DRAFT') throw new BadRequestException('Solo se pueden editar órdenes en borrador');

    return this.prisma.$transaction(async (tx) => {
      await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
      
      const totalAmount = (dto.lines || []).reduce((sum: number, l: any) => sum + (l.orderedQuantity * l.unitCost), 0);

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          destinationWarehouseId: dto.destinationWarehouseId,
          notes: dto.notes,
          totalAmount,
          lines: {
            create: (dto.lines || []).map((l: any) => ({
              variantId: l.variantId,
              orderedQuantity: l.orderedQuantity,
              unitCost: l.unitCost,
              totalAmount: l.orderedQuantity * l.unitCost
            }))
          }
        },
        include: { lines: true }
      });
    });
  }

  async removePO(id: string) {
    const po = await this.getPO(id);
    if (!po) throw new NotFoundException('Orden de compra no encontrada');
    if (po.status !== 'DRAFT') throw new BadRequestException('Solo se pueden borrar órdenes en borrador');

    return this.prisma.$transaction(async (tx) => {
      await tx.pOLineItem.deleteMany({ where: { purchaseOrderId: id } });
      return tx.purchaseOrder.delete({ where: { id } });
    });
  }
}

