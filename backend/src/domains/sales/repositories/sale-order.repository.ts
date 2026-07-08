import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';

@Injectable()
export class SaleOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const cleanId = id.replace(/^[VP]-/i, '');
    return this.prisma.saleOrder.findFirst({
      where: {
        OR: [
          { id: { equals: id } },
          { id: { startsWith: cleanId, mode: 'insensitive' } }
        ]
      },
      include: {
        lines: true,
        variance: true,
        customer: true,
        payments: { include: { paymentMethod: true } },
      }
    });
  }

  async findRecentByBranch(branchId: string, take: number = 50) {
    return this.prisma.saleOrder.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
      take,
      include: { lines: true, customer: true }
    });
  }

  async findPaginated(where: any, skip: number, take: number) {
    const [data, total] = await Promise.all([
      this.prisma.saleOrder.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { lines: true, customer: true }
      }),
      this.prisma.saleOrder.count({ where })
    ]);
    return { data, total };
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.saleOrder.update({
      where: { id },
      data: { status }
    });
  }
}
