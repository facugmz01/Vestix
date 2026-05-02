import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Domain-specific read operations.
   * All complex writes have been offloaded to the CheckoutOrchestrator.
   */
  async getOrderById(id: string) {
    return this.prisma.saleOrder.findUnique({
      where: { id },
      include: { 
        lines: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }, 
        customer: true,
        variance: true 
      }
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

  async getOrders(params: { page?: any; pageSize?: any; search?: string; status?: string }) {
    const page = parseInt(params.page) || 1;
    const pageSize = parseInt(params.pageSize) || 15;
    const skip = (page - 1) * pageSize;
    const { search, status } = params;

    const where: any = {};
    if (status) where.status = status;
    if (search && search.trim() !== '') {
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
        customerName: order.customer?.fullName || 'Consumidor Final'
      })), 
      total 
    };
  }
}
