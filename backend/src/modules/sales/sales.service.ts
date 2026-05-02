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
    // If the ID is a friendly ID (e.g. SL-123 or just the first part of UUID)
    // Strip prefixes like V- or P-
    const cleanId = id.replace(/^[VP]-/i, '');

    const order = await this.prisma.saleOrder.findFirst({
      where: {
        OR: [
          { id: { equals: id } },
          { id: { startsWith: cleanId, mode: 'insensitive' } }
        ]
      },
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

    return order;
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
