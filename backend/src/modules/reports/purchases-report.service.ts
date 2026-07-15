import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface PurchasesSummaryReport {
  period: { from: Date; to: Date };
  totalOrders: number;
  totalAmount: number;
  totalReceived: number;
  pendingAmount: number;
  topSuppliers: { supplierName: string; totalAmount: number }[];
}

@Injectable()
export class PurchasesReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getPurchasesSummary(params: { from: Date; to: Date }): Promise<PurchasesSummaryReport> {
    const { from, to } = params;

    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: {
        supplier: true,
      }
    });

    let totalAmount = 0;
    let totalReceived = 0;
    let pendingAmount = 0;
    
    const supplierMap = new Map<string, number>();

    for (const order of orders) {
      totalAmount += order.totalAmount;
      totalReceived += order.paidAmount; // assuming paidAmount is tracked, or we use totalAmount for received if COMPLETED? Actually, let's use paidAmount as what's "received/paid" in terms of cash, but "received" could mean stock. The interface asks for totalReceived, pendingAmount. Let's assume financial.
      pendingAmount += (order.totalAmount - order.paidAmount);

      const supplierName = order.supplier.companyName;
      const currentVal = supplierMap.get(supplierName) ?? 0;
      supplierMap.set(supplierName, currentVal + order.totalAmount);
    }

    const topSuppliers = Array.from(supplierMap.entries())
      .map(([supplierName, totalAmount]) => ({ supplierName, totalAmount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return {
      period: { from, to },
      totalOrders: orders.length,
      totalAmount,
      totalReceived, // financial paid amount for now
      pendingAmount,
      topSuppliers,
    };
  }
}
