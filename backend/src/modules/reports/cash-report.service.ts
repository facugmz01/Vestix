import { Injectable } from '@nestjs/common';
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

  async getCashSummary(params: { from: Date; to: Date; branchId?: string }): Promise<CashSummaryReport> {
    const { from, to, branchId } = params;

    const accountFilter = branchId ? { branchId } : {};

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        account: accountFilter
      },
      include: {
        account: true
      }
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    
    const methodMap = new Map<string, number>();
    const dailyMap = new Map<string, { income: number, expenses: number }>();

    for (const t of transactions) {
      // DEBIT = money in (sales, deposits); CREDIT = money out (refunds, cancellations)
      const dateKey = t.createdAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { income: 0, expenses: 0 });
      }
      const dayStats = dailyMap.get(dateKey)!;

      const method = t.account.type; // CASH, BANK, etc.

      if (t.type === 'DEBIT') {
        totalIncome += t.amount;
        dayStats.income += t.amount;
        methodMap.set(method, (methodMap.get(method) ?? 0) + t.amount);
      } else if (t.type === 'CREDIT') {
        totalExpenses += t.amount;
        dayStats.expenses += t.amount;
      }
    }

    const byMethod = Array.from(methodMap.entries()).map(([method, amount]) => ({ method, amount }));
    const dailySeries = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: { from, to },
      totalIncome,
      totalExpenses,
      netCash: totalIncome - totalExpenses,
      byMethod,
      dailySeries
    };
  }
}
