import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateReturnDto, ReturnAction } from './dto/create-return.dto';
import { InventoryService } from '../../logistics/inventory.service';
import { AfipProducer } from '../../invoicing/afip.producer';
import { AccountsService } from '../../finance/accounts.service';
import { formatSaleId } from '../../../common/utils/format-id.util';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly afipProducer: AfipProducer,
    private readonly accountsService: AccountsService,
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
        lines: { include: { orderLine: true } },
        saleOrder: { include: { customer: true } }
      }
    });
    if (!r) throw new NotFoundException('Return record not found');

    const variantIds = r.lines.map(l => l.orderLine?.variantId).filter(Boolean) as string[];
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true }
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    return {
      ...r,
      lines: r.lines.map(l => ({
        ...l,
        orderLine: l.orderLine ? {
          ...l.orderLine,
          variant: variantMap.get(l.orderLine.variantId) || null
        } : null
      }))
    };
  }

  async processReturn(dto: CreateReturnDto) {
    const sale = await this.prisma.saleOrder.findUnique({
      where: { id: dto.saleOrderId },
      include: { lines: true, customer: true }
    });

    if (!sale) throw new NotFoundException('Original sale not found');

    const result = await this.prisma.$transaction(async (tx) => {
      let totalRefund = 0;

      const saleReturn = await tx.saleReturn.create({
        data: {
          saleOrderId: dto.saleOrderId,
          branchId: dto.branchId,
          action: dto.action,
          status: 'PENDING',
          totalRefundAmount: 0,
        }
      });

      for (const item of dto.items) {
        const orderLine = sale.lines.find(l => l.id === item.orderLineId);
        if (!orderLine) throw new BadRequestException(`Line ${item.orderLineId} not found in original sale`);
        if (item.quantity > orderLine.quantity) throw new BadRequestException(`Cannot return more than purchased`);

        const lineRefundAmount = orderLine.finalPrice * item.quantity;
        totalRefund += lineRefundAmount;

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
      }

      return tx.saleReturn.update({
        where: { id: saleReturn.id },
        data: { totalRefundAmount: totalRefund },
        include: { lines: true }
      });
    });

    return result;
  }

  async approveReturn(id: string) {
    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id },
      include: {
        lines: true,
        saleOrder: { include: { lines: true, customer: true } },
      },
    });

    if (!saleReturn) throw new NotFoundException('Return record not found');
    if (saleReturn.status === 'APPROVED') {
      throw new BadRequestException('La devolución ya fue aprobada');
    }
    if (saleReturn.status === 'REJECTED') {
      throw new BadRequestException('No se puede aprobar una devolución rechazada');
    }

    const sale = saleReturn.saleOrder;
    const totalRefund = saleReturn.totalRefundAmount;

    const result = await this.prisma.$transaction(async (tx) => {
      for (const line of saleReturn.lines) {
        if (line.condition === 'SELLABLE') {
          const targetWarehouseId = (sale as any).warehouseId;

          if (targetWarehouseId) {
            await this.inventoryService.recordMovement({
              variantId: line.variantId,
              sourceWarehouseId: null,
              destinationWarehouseId: targetWarehouseId,
              branchId: sale.branchId,
              type: 'SALE_RETURN',
              quantity: line.quantity,
              unitCost: line.unitPrice,
              referenceId: saleReturn.id,
            }, tx);
          }
        }
      }

      if (saleReturn.action === ReturnAction.STORE_CREDIT && sale.customerId) {
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

        const refundDescription = `Reembolso venta ${formatSaleId(sale.id, sale.status)}`;
        await this.accountsService.postTransactionInTx(
          tx,
          accountId,
          'CREDIT',
          totalRefund,
          saleReturn.id,
          refundDescription,
        );
        await tx.treasuryReceipt.create({
          data: {
            accountId,
            amount: -totalRefund,
            payerName: sale.customer?.fullName || 'Consumidor Final',
            referenceId: saleReturn.id,
            description: refundDescription,
          }
        });
      }

      return tx.saleReturn.update({
        where: { id },
        data: { status: 'APPROVED' },
        include: { lines: true, saleOrder: { include: { customer: true } } },
      });
    });

    if ((sale as any).issueInvoice) {
      await this.afipProducer.enqueueCreditNote(result.id, sale.branchId);
    }

    return result;
  }

  async rejectReturn(id: string) {
    const saleReturn = await this.prisma.saleReturn.findUnique({
      where: { id },
      include: { lines: true, saleOrder: true },
    });

    if (!saleReturn) throw new NotFoundException('Return record not found');
    if (saleReturn.status === 'REJECTED') {
      throw new BadRequestException('La devolución ya fue rechazada');
    }
    if (saleReturn.status === 'APPROVED') {
      throw new BadRequestException('No se puede rechazar una devolución ya aprobada');
    }

    return this.prisma.saleReturn.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { lines: true, saleOrder: { include: { customer: true } } },
    });
  }
}
