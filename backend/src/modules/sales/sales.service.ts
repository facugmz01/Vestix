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
      include: { lines: true }
    });
  }
}
