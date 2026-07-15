import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { CashReportService } from './cash-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const salesSummary = {
  totalOrders: 5,
  netRevenue: 10000,
  averageOrderValue: 2000,
  byPaymentMethod: [{ method: 'CASH', count: 5, amount: 10000 }],
};

const cogsSummary = { grossMarginPct: 35 };

const purchasesSummary = {
  totalOrders: 2,
  totalAmount: 5000,
  totalReceived: 2000,
  pendingAmount: 3000,
  topSuppliers: [],
};

const cashSummary = {
  totalIncome: 8000,
  totalExpenses: 2500,
  netCash: 5500,
};

const mockSalesReport: any = {
  getSalesSummary: jest.fn().mockReturnValue(salesSummary),
  getTopSellers: jest.fn().mockReturnValue([]),
  getCogsReport: jest.fn().mockReturnValue(cogsSummary),
};

const mockStockReport: any = {
  getLowStockAlerts: jest.fn().mockReturnValue([]),
};

const mockPurchasesReport: any = {
  getPurchasesSummary: jest.fn().mockReturnValue(purchasesSummary),
};

const mockCashReport: any = {
  getCashSummary: jest.fn().mockReturnValue(cashSummary),
};

const mockPrismaService: any = {
  saleOrder: { count: jest.fn().mockReturnValue(3) },
  financialAccount: {
    findMany: jest.fn().mockReturnValue([{ balance: 1500 }, { balance: 500 }]),
  },
  supplier: {
    aggregate: jest.fn().mockReturnValue({ _sum: { balance: 4200 } }),
  },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: SalesReportService, useValue: mockSalesReport },
        { provide: StockReportService, useValue: mockStockReport },
        { provide: PurchasesReportService, useValue: mockPurchasesReport },
        { provide: CashReportService, useValue: mockCashReport },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();

    mockSalesReport.getSalesSummary.mockReturnValue(salesSummary);
    mockSalesReport.getTopSellers.mockReturnValue([]);
    mockSalesReport.getCogsReport.mockReturnValue(cogsSummary);
    mockStockReport.getLowStockAlerts.mockReturnValue([]);
    mockPurchasesReport.getPurchasesSummary.mockReturnValue(purchasesSummary);
    mockCashReport.getCashSummary.mockReturnValue(cashSummary);
    mockPrismaService.saleOrder.count.mockReturnValue(3);
    mockPrismaService.financialAccount.findMany.mockReturnValue([{ balance: 1500 }, { balance: 500 }]);
    mockPrismaService.supplier.aggregate.mockReturnValue({ _sum: { balance: 4200 } });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return a complete dashboard summary including purchases and treasury', async () => {
      const result = await service.getDashboard();

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.today.revenue).toBe(10000);
      expect(result.today.orders).toBe(5);
      expect(result.today.avgOrderValue).toBe(2000);
      expect(result.today.cashInDrawers).toBe(2000);
      expect(result.today.purchasesTotal).toBe(5000);
      expect(result.today.supplierPayments).toBe(2500);
      expect(result.thisMonth.revenue).toBe(10000);
      expect(result.thisMonth.grossMarginPct).toBe(35);
      expect(result.thisMonth.purchasesTotal).toBe(5000);
      expect(result.thisMonth.purchasesPaid).toBe(2000);
      expect(result.thisMonth.purchasesDebt).toBe(3000);
      expect(result.thisMonth.cashExpenses).toBe(2500);
      expect(result.thisMonth.netCash).toBe(5500);
      expect(result.supplierPayableBalance).toBe(4200);
      expect(result.pendingOrders).toBe(3);
    });

    it('should pass branchId to sub-reports', async () => {
      await service.getDashboard('b1');

      expect(mockSalesReport.getSalesSummary).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'b1' }),
      );
      expect(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1');
      expect(mockCashReport.getCashSummary).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'b1' }),
      );
      expect(mockPrismaService.financialAccount.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ branchId: 'b1' }) }),
      );
    });
  });
});
