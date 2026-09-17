import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

  /**
   * Summarises purchase orders and supplier expenses using database aggregations.
   */
  async getPurchasesSummary(params: { from: Date; to: Date; branchId?: string }): Promise<PurchasesSummaryReport> {
    const { from, to, branchId } = params;

    const branchFilter = branchId ? { branchId } : {};

    const agg = await this.prisma.purchaseOrder.aggregate({
      _count: { id: true },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
      where: {
        createdAt: { gte: from, lte: to },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
        ...branchFilter,
      },
    });

    const totalOrders = agg._count.id || 0;
    const totalAmount = Math.round((agg._sum.totalAmount || 0) * 100) / 100;
    const totalReceived = Math.round((agg._sum.paidAmount || 0) * 100) / 100;
    const pendingAmount = Math.max(0, Math.round((totalAmount - totalReceived) * 100) / 100);

    const branchSql = branchId
      ? Prisma.sql`AND po."branchId" = ${branchId}`
      : Prisma.empty;

    const supplierRows: Array<{ supplierName: string; totalAmount: number }> = await this.prisma.$queryRaw`
      SELECT 
        s."companyName" AS "supplierName",
        ROUND(COALESCE(SUM(po."totalAmount"), 0)::numeric, 2)::float AS "totalAmount"
      FROM "purchasing"."PurchaseOrder" po
      JOIN "purchasing"."Supplier" s ON s.id = po."supplierId"
      WHERE po.status NOT IN ('CANCELLED', 'DRAFT')
        AND po."createdAt" >= ${from} AND po."createdAt" <= ${to}
        ${branchSql}
      GROUP BY s."companyName"
      ORDER BY "totalAmount" DESC
      LIMIT 5;
    `;

    const topSuppliers = (supplierRows || []).map(r => ({
      supplierName: r.supplierName,
      totalAmount: Number(r.totalAmount),
    }));

    return {
      period: { from, to },
      totalOrders,
      totalAmount,
      totalReceived,
      pendingAmount,
      topSuppliers,
    };
  }
}
