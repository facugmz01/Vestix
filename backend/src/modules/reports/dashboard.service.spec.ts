import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const salesSummary = {
  totalOrders: 5,
  netRevenue: 10000,
  averageOrderValue: 2000,
  byPaymentMethod: [{ method: 'CASH', count: 5, amount: 10000 }],
};

const cogsSummary = { grossMarginPct: 35 };

const mockSalesReport: any = {
  getSalesSummary: jest.fn().mockReturnValue(salesSummary),
  getTopSellers: jest.fn().mockReturnValue([]),
  getCogsReport: jest.fn().mockReturnValue(cogsSummary),
};

const mockStockReport: any = {
  getLowStockAlerts: jest.fn().mockReturnValue([]),
};

const mockPrismaService: any = {
  saleOrder: { count: jest.fn().mockReturnValue(3) },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: SalesReportService, useValue: mockSalesReport },
        { provide: StockReportService, useValue: mockStockReport },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();

    // Re-apply default return values after clearAllMocks
    mockSalesReport.getSalesSummary.mockReturnValue(salesSummary);
    mockSalesReport.getTopSellers.mockReturnValue([]);
    mockSalesReport.getCogsReport.mockReturnValue(cogsSummary);
    mockStockReport.getLowStockAlerts.mockReturnValue([]);
    mockPrismaService.saleOrder.count.mockReturnValue(3);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return a complete dashboard summary', async () => {
      const result = await service.getDashboard();

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.today.revenue).toBe(10000);
      expect(result.today.orders).toBe(5);
      expect(result.today.avgOrderValue).toBe(2000);
      expect(result.today.cashInDrawers).toBe(10000);
      expect(result.thisMonth.revenue).toBe(10000);
      expect(result.thisMonth.grossMarginPct).toBe(35);
      expect(result.pendingOrders).toBe(3);
    });

    it('should pass branchId to sub-reports', async () => {
      await service.getDashboard('b1');

      expect(mockSalesReport.getSalesSummary).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'b1' }),
      );
      expect(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1');
    });

    it('should return 0 cashInDrawers when no CASH payment method', async () => {
      mockSalesReport.getSalesSummary.mockReturnValue({
        ...salesSummary,
        byPaymentMethod: [{ method: 'CARD', count: 5, amount: 10000 }],
      });

      const result = await service.getDashboard();
      expect(result.today.cashInDrawers).toBe(0);
    });
  });
});
