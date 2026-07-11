import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportExportService } from './report-export.service';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';

describe('ReportExportService', () => {
  let service: ReportExportService;

  const mockSalesReport: any = {
    getSalesSummary: jest.fn(),
    getTopSellers: jest.fn(),
    getCogsReport: jest.fn(),
  };

  const mockStockReport: any = {
    getStockValuation: jest.fn(),
    getLowStockAlerts: jest.fn(),
  };

  const mockCashReport: any = {
    getCashSummary: jest.fn(),
  };

  const mockPurchasesReport: any = {
    getPurchasesSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportExportService,
        { provide: SalesReportService, useValue: mockSalesReport },
        { provide: StockReportService, useValue: mockStockReport },
        { provide: CashReportService, useValue: mockCashReport },
        { provide: PurchasesReportService, useValue: mockPurchasesReport },
      ],
    }).compile();

    service = module.get(ReportExportService);
    jest.clearAllMocks();
  });

  it('should generate sales CSV with summary and top sellers', async () => {
    mockSalesReport.getSalesSummary.mockResolvedValue({
      totalOrders: 2,
      totalRevenue: 1000,
      totalDiscounts: 50,
      netRevenue: 950,
      averageOrderValue: 475,
      byPaymentMethod: [{ method: 'CASH', count: 2, amount: 950 }],
      byChannel: { POS: 950 },
    });
    mockSalesReport.getTopSellers.mockResolvedValue([
      { sku: 'SKU-1', name: 'Shirt', totalUnitsSold: 3, totalRevenue: 300 },
    ]);
    mockSalesReport.getCogsReport.mockResolvedValue({
      totalCOGS: 120,
      totalRevenue: 950,
      grossProfit: 830,
      grossMarginPct: 87.37,
    });

    const result = await service.export('sales', { from: '2026-01-01', to: '2026-01-31' });
    const csv = Buffer.from(result.base64, 'base64').toString('utf-8');

    expect(result.downloadUrl).toContain('data:text/csv;charset=utf-8,');
    expect(result.contentType).toBe('text/csv; charset=utf-8');
    expect(result.filename).toMatch(/^sales-report-/);
    expect(csv).toContain('Sales Summary');
    expect(csv).toContain('Total Orders,2');
    expect(csv).toContain('SKU-1,Shirt,3,300');
    expect(mockSalesReport.getSalesSummary).toHaveBeenCalled();
    expect(mockSalesReport.getTopSellers).toHaveBeenCalled();
    expect(mockSalesReport.getCogsReport).toHaveBeenCalled();
  });

  it('should generate stock CSV with valuation lines', async () => {
    mockStockReport.getStockValuation.mockResolvedValue({
      generatedAt: new Date('2026-01-15T12:00:00.000Z'),
      totalSKUs: 1,
      totalUnits: 10,
      totalValueAtCost: 500,
      totalValueAtRetail: 800,
      potentialMargin: 37.5,
      lines: [{
        sku: 'SKU-2',
        availableQty: 10,
        reservedQty: 0,
        unitCostWac: 50,
        unitRetailPrice: 80,
        totalCostValue: 500,
        totalRetailValue: 800,
      }],
    });
    mockStockReport.getLowStockAlerts.mockResolvedValue([]);

    const result = await service.export('stock', { branchId: 'b1' });
    const csv = Buffer.from(result.base64, 'base64').toString('utf-8');

    expect(csv).toContain('Stock Valuation');
    expect(csv).toContain('SKU-2,10,0,50,80,500,800');
    expect(mockStockReport.getStockValuation).toHaveBeenCalledWith('b1');
  });

  it('should generate purchases CSV', async () => {
    mockPurchasesReport.getPurchasesSummary.mockResolvedValue({
      totalOrders: 1,
      totalAmount: 2000,
      totalReceived: 500,
      pendingAmount: 1500,
      topSuppliers: [{ supplierName: 'Acme', totalAmount: 2000 }],
    });

    const result = await service.export('purchases', { from: '2026-01-01', to: '2026-01-31' });
    const csv = Buffer.from(result.base64, 'base64').toString('utf-8');

    expect(csv).toContain('Purchases Summary');
    expect(csv).toContain('Acme,2000');
  });

  it('should generate cash CSV with daily series', async () => {
    mockCashReport.getCashSummary.mockResolvedValue({
      totalIncome: 1000,
      totalExpenses: 200,
      netCash: 800,
      byMethod: [{ method: 'CASH', amount: 1000 }],
      dailySeries: [{ date: '2026-01-01', income: 1000, expenses: 200 }],
    });

    const result = await service.export('cash', { from: '2026-01-01', to: '2026-01-31', branchId: 'b1' });
    const csv = Buffer.from(result.base64, 'base64').toString('utf-8');

    expect(csv).toContain('Cash Summary');
    expect(csv).toContain('2026-01-01,1000,200');
    expect(mockCashReport.getCashSummary).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'b1' }),
    );
  });

  it('should reject unsupported export types', async () => {
    await expect(service.export('unknown', {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
