import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { DashboardService } from './dashboard.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/rbac/guards/permissions.guard';

const mockSalesReport: any = {
  getSalesSummary: jest.fn(),
  getTopSellers: jest.fn(),
  getCogsReport: jest.fn(),
};

const mockStockReport: any = {
  getStockValuation: jest.fn(),
  getLowStockAlerts: jest.fn(),
};

const mockDashboard: any = {
  getDashboard: jest.fn(),
};

const mockCashReport: any = {
  getCashSummary: jest.fn(),
};

const mockPurchasesReport: any = {
  getPurchasesSummary: jest.fn(),
};

describe('ReportsController', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: SalesReportService, useValue: mockSalesReport },
        { provide: StockReportService, useValue: mockStockReport },
        { provide: DashboardService, useValue: mockDashboard },
        { provide: CashReportService, useValue: mockCashReport },
        { provide: PurchasesReportService, useValue: mockPurchasesReport },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ReportsController>(ReportsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should delegate to dashboardService', () => {
      const expected = { today: { revenue: 1000 } };
      mockDashboard.getDashboard.mockReturnValue(expected);
      expect(controller.getDashboard('b1')).toEqual(expected);
      expect(mockDashboard.getDashboard).toHaveBeenCalledWith('b1');
    });
  });

  describe('getSalesSummary', () => {
    it('should pass parsed dates to salesReport', () => {
      mockSalesReport.getSalesSummary.mockReturnValue({ totalOrders: 5 });
      controller.getSalesSummary('2026-01-01', '2026-01-31', 'b1');
      const call = mockSalesReport.getSalesSummary.mock.calls[0][0];
      expect(call.from).toEqual(new Date('2026-01-01'));
      expect(call.to).toEqual(new Date('2026-01-31'));
      expect(call.branchId).toBe('b1');
    });
  });

  describe('getTopSellers', () => {
    it('should delegate to salesReport.getTopSellers', () => {
      mockSalesReport.getTopSellers.mockReturnValue([]);
      controller.getTopSellers('2026-01-01', '2026-01-31');
      const call = mockSalesReport.getTopSellers.mock.calls[0][0];
      expect(call.from).toEqual(new Date('2026-01-01'));
    });
  });

  describe('getCogsReport', () => {
    it('should delegate to salesReport.getCogsReport', () => {
      mockSalesReport.getCogsReport.mockReturnValue({ totalCOGS: 500 });
      controller.getCogsReport('2026-01-01', '2026-01-31');
      expect(mockSalesReport.getCogsReport).toHaveBeenCalled();
    });
  });

  describe('getStockValuation', () => {
    it('should delegate to stockReport.getStockValuation', () => {
      mockStockReport.getStockValuation.mockReturnValue({ totalSKUs: 100 });
      expect(controller.getStockValuation('b1')).toEqual({ totalSKUs: 100 });
      expect(mockStockReport.getStockValuation).toHaveBeenCalledWith('b1');
    });
  });

  describe('getLowStockAlerts', () => {
    it('should parse reorderPoint as integer', () => {
      mockStockReport.getLowStockAlerts.mockReturnValue([]);
      controller.getLowStockAlerts('b1', '10');
      expect(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1', 10);
    });

    it('should pass undefined when reorderPoint is not provided', () => {
      mockStockReport.getLowStockAlerts.mockReturnValue([]);
      controller.getLowStockAlerts('b1');
      expect(mockStockReport.getLowStockAlerts).toHaveBeenCalledWith('b1', undefined);
    });
  });

  describe('getPurchasesSummary', () => {
    it('should delegate to purchasesReport', () => {
      mockPurchasesReport.getPurchasesSummary.mockReturnValue({ totalOrders: 3 });
      controller.getPurchasesSummary('2026-01-01', '2026-01-31', 'b1');
      const call = mockPurchasesReport.getPurchasesSummary.mock.calls[0][0];
      expect(call.from).toEqual(new Date('2026-01-01'));
      expect(call.to).toEqual(new Date('2026-01-31'));
    });
  });

  describe('getCashSummary', () => {
    it('should delegate to cashReport with parsed dates and branchId', () => {
      mockCashReport.getCashSummary.mockReturnValue({ netCash: 500 });
      controller.getCashSummary('2026-01-01', '2026-01-31', 'b1');
      const call = mockCashReport.getCashSummary.mock.calls[0][0];
      expect(call.from).toEqual(new Date('2026-01-01'));
      expect(call.branchId).toBe('b1');
    });
  });

  describe('exportReport', () => {
    it('should return a downloadUrl', () => {
      const result = controller.exportReport({});
      expect(result.downloadUrl).toContain('data:text/csv');
    });
  });
});
