import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StockMovementService } from '../inventory/stock-movement.service';

@Injectable()
export class PurchasingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService
  ) {}

  async createPO(dto: any) {
    return this.prisma.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        destinationWarehouseId: dto.destinationWarehouseId,
        status: 'DRAFT',
        totalAmount: dto.totalAmount || 0,
        paidAmount: 0,
        currency: dto.currency || 'ARS',
        notes: dto.notes,
        lines: {
          create: dto.lines.map(l => ({
            variantId: l.variantId,
            orderedQuantity: l.orderedQuantity,
            unitCost: l.unitCost,
            totalAmount: l.orderedQuantity * l.unitCost
          }))
        }
      },
      include: { lines: true }
    });
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

  // --- METHODS FOR GOODS RECEIPT ---

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
}
