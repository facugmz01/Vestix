import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesReportService } from './purchases-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  purchaseOrder: { findMany: jest.fn() },
};

describe('PurchasesReportService', () => {
  let service: PurchasesReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesReportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PurchasesReportService>(PurchasesReportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPurchasesSummary', () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');

    it('should return zero totals when no orders', async () => {
      mockPrismaService.purchaseOrder.findMany.mockResolvedValueOnce([]);
      const result = await service.getPurchasesSummary({ from, to });
      expect(result.totalOrders).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalReceived).toBe(0);
      expect(result.pendingAmount).toBe(0);
      expect(result.topSuppliers).toEqual([]);
    });

    it('should aggregate orders and track top suppliers', async () => {
      mockPrismaService.purchaseOrder.findMany.mockResolvedValueOnce([
        { totalAmount: 5000, paidAmount: 3000, supplier: { companyName: 'SupplierA' } },
        { totalAmount: 2000, paidAmount: 2000, supplier: { companyName: 'SupplierB' } },
        { totalAmount: 8000, paidAmount: 5000, supplier: { companyName: 'SupplierA' } },
      ]);

      const result = await service.getPurchasesSummary({ from, to });
      expect(result.totalOrders).toBe(3);
      expect(result.totalAmount).toBe(15000);
      expect(result.totalReceived).toBe(10000);
      expect(result.pendingAmount).toBe(5000);
      expect(result.topSuppliers[0].supplierName).toBe('SupplierA');
      expect(result.topSuppliers[0].totalAmount).toBe(13000);
      expect(result.topSuppliers[1].supplierName).toBe('SupplierB');
    });

    it('should limit top suppliers to 5', async () => {
      const orders = Array.from({ length: 10 }, (_, i) => ({
        totalAmount: 1000 * (i + 1),
        paidAmount: 500,
        supplier: { companyName: `Supplier${i}` },
      }));
      mockPrismaService.purchaseOrder.findMany.mockResolvedValueOnce(orders);

      const result = await service.getPurchasesSummary({ from, to });
      expect(result.topSuppliers).toHaveLength(5);
      expect(result.topSuppliers[0].totalAmount).toBeGreaterThan(result.topSuppliers[4].totalAmount);
    });
  });
});
