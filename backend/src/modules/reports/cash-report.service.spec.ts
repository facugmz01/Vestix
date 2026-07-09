import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CashReportService } from './cash-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  financialTransaction: { findMany: jest.fn() },
};

describe('CashReportService', () => {
  let service: CashReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashReportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CashReportService>(CashReportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCashSummary', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    it('should return zero totals when no transactions', async () => {
      mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([]);
      const result = await service.getCashSummary({ from, to });
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netCash).toBe(0);
      expect(result.byMethod).toEqual([]);
      expect(result.dailySeries).toEqual([]);
    });

    it('should correctly aggregate income and expenses', async () => {
      mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([
        { type: 'DEBIT', amount: 1000, createdAt: new Date('2026-01-15'), account: { type: 'CASH' } },
        { type: 'DEBIT', amount: 500, createdAt: new Date('2026-01-15'), account: { type: 'BANK' } },
        { type: 'CREDIT', amount: 300, createdAt: new Date('2026-01-15'), account: { type: 'CASH' } },
        { type: 'CREDIT', amount: 200, createdAt: new Date('2026-01-16'), account: { type: 'CASH' } },
      ]);

      const result = await service.getCashSummary({ from, to });
      expect(result.totalIncome).toBe(1500);
      expect(result.totalExpenses).toBe(500);
      expect(result.netCash).toBe(1000);
      expect(result.byMethod).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: 'CASH', amount: 1000 }),
          expect.objectContaining({ method: 'BANK', amount: 500 }),
        ]),
      );
    });

    it('should count cancellation reversals as expenses, not income', async () => {
      mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([
        { type: 'DEBIT', amount: 5000, createdAt: new Date('2026-01-15'), account: { type: 'CASH' } },
        { type: 'CREDIT', amount: 5000, createdAt: new Date('2026-01-15'), account: { type: 'CASH' } },
      ]);

      const result = await service.getCashSummary({ from, to });
      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpenses).toBe(5000);
      expect(result.netCash).toBe(0);
    });

    it('should produce sorted daily series', async () => {
      mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([
        { type: 'DEBIT', amount: 100, createdAt: new Date('2026-01-20'), account: { type: 'CASH' } },
        { type: 'DEBIT', amount: 200, createdAt: new Date('2026-01-10'), account: { type: 'CASH' } },
      ]);

      const result = await service.getCashSummary({ from, to });
      expect(result.dailySeries).toHaveLength(2);
      expect(result.dailySeries[0].date).toBe('2026-01-10');
      expect(result.dailySeries[1].date).toBe('2026-01-20');
    });

    it('should apply branch filter when provided', async () => {
      mockPrismaService.financialTransaction.findMany.mockResolvedValueOnce([]);
      await service.getCashSummary({ from, to, branchId: 'b1' });
      expect(mockPrismaService.financialTransaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            account: { branchId: 'b1' },
          }),
        }),
      );
    });
  });
});
