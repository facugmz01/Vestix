import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CashReportService } from './cash-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  $queryRaw: jest.fn(),
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
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]); // methodRows
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]); // seriesRows

      const result = await service.getCashSummary({ from, to });
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netCash).toBe(0);
      expect(result.byMethod).toEqual([]);
      expect(result.dailySeries).toEqual([]);
    });

    it('should correctly aggregate income and expenses', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { method: 'CASH', income: 1000, expenses: 500 },
        { method: 'BANK', income: 500, expenses: 0 },
      ]);
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { date: '2026-01-15', income: 1500, expenses: 500 },
      ]);

      const result = await service.getCashSummary({ from, to });
      expect(result.totalIncome).toBe(1500);
      expect(result.totalExpenses).toBe(500);
      expect(result.netCash).toBe(1000);
      expect(result.byMethod).toEqual([
        { method: 'CASH', amount: 1000 },
        { method: 'BANK', amount: 500 },
      ]);
      expect(result.dailySeries).toEqual([
        { date: '2026-01-15', income: 1500, expenses: 500 },
      ]);
    });
  });
});
