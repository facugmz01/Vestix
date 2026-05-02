import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Domain-specific read operations.
   * All complex writes have been offloaded to the CheckoutOrchestrator.
   */
  async getOrderById(id: string) {
    return this.prisma.saleOrder.findUnique({
      where: { id },
      include: { lines: true, variance: true }
    });
  }

  async listRecentOrders(branchId: string) {
    return this.prisma.saleOrder.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { lines: true, customer: true }
    });
  }

  async getOrders(params: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const { page = 1, pageSize = 15, search, status } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { customer: { fullName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { lines: true, customer: true }
      }),
      this.prisma.saleOrder.count({ where })
    ]);

    return { 
      data: data.map(order => ({
        ...order,
        customerName: order.customer?.fullName
      })), 
      total 
    };
  }
}
