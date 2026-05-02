import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateReturnDto, ReturnAction } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.$transaction(async (tx) => {
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
        // Only restore if the condition is NEW or SELLABLE (assuming NEW maps to SELLABLE logic)
        if (item.condition === 'NEW') {
          // Find the warehouse from the original sale if possible, or use the branch default
          // Since we added warehouseId to SaleOrder recently, let's use it.
          const targetWarehouseId = (sale as any).warehouseId;
          
          if (targetWarehouseId) {
            await tx.inventoryMovement.create({
              data: {
                variantId: item.variantId,
                destinationWarehouseId: targetWarehouseId,
                type: 'SALE_RETURN',
                quantity: item.quantity,
                unitCost: orderLine.basePrice,
                referenceId: saleReturn.id
              }
            });

            await tx.stockLevel.update({
              where: { variantId_warehouseId: { variantId: item.variantId, warehouseId: targetWarehouseId } },
              data: {
                physicalQuantity: { increment: item.quantity },
                availableQuantity: { increment: item.quantity }
              }
            });
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
        // Create an outflow receipt in Treasury
        await tx.treasuryReceipt.create({
          data: {
            amount: -totalRefund, // Negative for outflow
            payerName: sale.customer?.fullName || 'Consumidor Final',
            referenceId: saleReturn.id,
            description: `Refund for Sale ${sale.id.split('-')[0]}`
          }
        });
      }

      // 5. UPDATE TOTAL
      return tx.saleReturn.update({
        where: { id: saleReturn.id },
        data: { totalRefundAmount: totalRefund },
        include: { lines: true }
      });
    });
  }
}
