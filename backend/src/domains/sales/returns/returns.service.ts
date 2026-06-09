import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateReturnDto, ReturnAction } from './dto/create-return.dto';
import { InventoryService } from '../../logistics/inventory.service';
import { AfipProducer } from '../../invoicing/afip.producer';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly afipProducer: AfipProducer,
  ) {}

  async getReturns(params: { page?: any; pageSize?: any; search?: string; status?: string }) {
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const skip = (page - 1) * pageSize;
    const { search, status } = params;

    const where: any = {};
    if (status) where.status = status;
    if (search && search.trim() !== '') {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { saleOrder: { id: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.saleReturn.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { lines: true, saleOrder: { include: { customer: true } } }
      }),
      this.prisma.saleReturn.count({ where })
    ]);

    return { 
      data: data.map(r => ({
        ...r,
        customerName: r.saleOrder?.customer?.fullName || 'Consumidor Final',
        totalRefundAmount: r.totalRefundAmount
      })), 
      total 
    };
  }

  async getReturnById(id: string) {
    const r = await this.prisma.saleReturn.findUnique({
      where: { id },
      include: { 
        lines: { include: { orderLine: { include: { variant: { include: { product: true } } } } } },
        saleOrder: { include: { customer: true } }
      }
    });
    if (!r) throw new NotFoundException('Return record not found');
    return r;
  }

  async processReturn(dto: CreateReturnDto) {
    const sale = await this.prisma.saleOrder.findUnique({
      where: { id: dto.saleOrderId },
      include: { lines: true, customer: true }
    });

    if (!sale) throw new NotFoundException('Original sale not found');

    const result = await this.prisma.$transaction(async (tx) => {
      let totalRefund = 0;

      // 1. CREATE RETURN RECORD
      const saleReturn = await tx.saleReturn.create({
        data: {
          saleOrderId: dto.saleOrderId,
          branchId: dto.branchId,
          action: dto.action,
          status: 'APPROVED', // Auto-approved for now as per user request "dedolver el dinero y el stock"
          totalRefundAmount: 0, // Will update after calculating lines
        }
      });

      for (const item of dto.items) {
        const orderLine = sale.lines.find(l => l.id === item.orderLineId);
        if (!orderLine) throw new BadRequestException(`Line ${item.orderLineId} not found in original sale`);
        if (item.quantity > orderLine.quantity) throw new BadRequestException(`Cannot return more than purchased`);

        const lineRefundAmount = orderLine.finalPrice * item.quantity;
        totalRefund += lineRefundAmount;

        // 2. CREATE RETURN LINE
        await tx.saleReturnLine.create({
          data: {
            returnId: saleReturn.id,
            orderLineId: item.orderLineId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: orderLine.basePrice,
            condition: item.condition,
            reason: item.reason
          }
        });

        // 3. RESTORE STOCK (Inbound Movement)
        // Only restore if the condition is SELLABLE
        if (item.condition === 'SELLABLE') {
          const targetWarehouseId = (sale as any).warehouseId;
          
          if (targetWarehouseId) {
            await this.inventoryService.recordMovement({
              variantId: item.variantId,
              sourceWarehouseId: null,
              destinationWarehouseId: targetWarehouseId,
              branchId: sale.branchId,
              type: 'SALE_RETURN',
              quantity: item.quantity,
              unitCost: orderLine.basePrice,
              referenceId: saleReturn.id,
            }, tx);
          }
        }
      }

      // 4. FINANCIAL REFUND
      if (dto.action === ReturnAction.STORE_CREDIT && sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { usedCredit: { decrement: totalRefund } }
        });
      } else {
        let accountId = sale.paymentAccountId;
        if (!accountId) {
          const defaultAccount = await tx.financialAccount.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
          });
          accountId = defaultAccount?.id;
        }

        if (!accountId) {
          throw new BadRequestException('No existe ninguna cuenta de tesorería configurada para procesar el reembolso. Por favor, cree una caja o cuenta bancaria primero.');
        }

        await tx.treasuryReceipt.create({
          data: {
            accountId,
            amount: -totalRefund, // Negative for outflow
            payerName: sale.customer?.fullName || 'Consumidor Final',
            referenceId: saleReturn.id,
            description: `Refund for Sale ${sale.id.split('-')[0]}`
          }
        });
      }

      // 5. UPDATE TOTAL
      const updatedReturn = await tx.saleReturn.update({
        where: { id: saleReturn.id },
        data: { totalRefundAmount: totalRefund },
        include: { lines: true }
      });

      return updatedReturn;
    });

    // 6. AFIP INTEGRATION (Post-Transaction)
    // If the original sale was invoiced to AFIP, we must issue a Credit Note
    if ((sale as any).issueInvoice) {
      await this.afipProducer.enqueueCreditNote(result.id, sale.branchId);
    }

    return result;
  }
}
