import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface CashSummaryReport {
  period: { from: Date; to: Date };
  totalIncome: number;
  totalExpenses: number;
  netCash: number;
  byMethod: { method: string; amount: number }[];
  dailySeries: { date: string; income: number; expenses: number }[];
}

@Injectable()
export class CashReportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Summarises treasury and cash transactions using PostgreSQL native aggregation.
   * Groups daily series using Argentina Timezone ('America/Argentina/Buenos_Aires') to prevent date leaking.
   */
  async getCashSummary(params: { from: Date; to: Date; branchId?: string }): Promise<CashSummaryReport> {
    const { from, to, branchId } = params;

    const accountBranchSql = branchId
      ? Prisma.sql`AND fa."branchId" = ${branchId}`
      : Prisma.empty;

    // 1. Grouped by Financial Account Type (CASH, BANK, etc.)
    const methodRows: Array<{ method: string; income: number; expenses: number }> = await this.prisma.$queryRaw`
      SELECT 
        COALESCE(fa.type, 'OTHER') AS method,
        ROUND(COALESCE(SUM(CASE WHEN ft.type = 'DEBIT' THEN ft.amount ELSE 0 END), 0)::numeric, 2)::float AS income,
        ROUND(COALESCE(SUM(CASE WHEN ft.type = 'CREDIT' THEN ft.amount ELSE 0 END), 0)::numeric, 2)::float AS expenses
      FROM "finance"."FinancialTransaction" ft
      JOIN "finance"."FinancialAccount" fa ON fa.id = ft."accountId"
      WHERE ft."createdAt" >= ${from} AND ft."createdAt" <= ${to}
        ${accountBranchSql}
      GROUP BY fa.type;
    `;

    let totalIncome = 0;
    let totalExpenses = 0;
    const byMethod: { method: string; amount: number }[] = [];

    for (const row of methodRows || []) {
      const inc = Number(row.income) || 0;
      const exp = Number(row.expenses) || 0;
      totalIncome += inc;
      totalExpenses += exp;
      byMethod.push({ method: row.method, amount: inc });
    }

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpenses = Math.round(totalExpenses * 100) / 100;
    const netCash = Math.round((totalIncome - totalExpenses) * 100) / 100;

    // 2. Daily series grouped strictly by Argentina calendar date (America/Argentina/Buenos_Aires)
    const seriesRows: Array<{ date: string; income: number; expenses: number }> = await this.prisma.$queryRaw`
      SELECT 
        TO_CHAR(timezone('America/Argentina/Buenos_Aires', ft."createdAt"), 'YYYY-MM-DD') AS date,
        ROUND(COALESCE(SUM(CASE WHEN ft.type = 'DEBIT' THEN ft.amount ELSE 0 END), 0)::numeric, 2)::float AS income,
        ROUND(COALESCE(SUM(CASE WHEN ft.type = 'CREDIT' THEN ft.amount ELSE 0 END), 0)::numeric, 2)::float AS expenses
      FROM "finance"."FinancialTransaction" ft
      JOIN "finance"."FinancialAccount" fa ON fa.id = ft."accountId"
      WHERE ft."createdAt" >= ${from} AND ft."createdAt" <= ${to}
        ${accountBranchSql}
      GROUP BY TO_CHAR(timezone('America/Argentina/Buenos_Aires', ft."createdAt"), 'YYYY-MM-DD')
      ORDER BY date ASC;
    `;

    const dailySeries = (seriesRows || []).map(r => ({
      date: r.date,
      income: Number(r.income),
      expenses: Number(r.expenses),
    }));

    return {
      period: { from, to },
      totalIncome,
      totalExpenses,
      netCash,
      byMethod,
      dailySeries,
    };
  }
}
