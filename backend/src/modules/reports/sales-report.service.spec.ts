import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesReportService } from './sales-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  saleOrder: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  saleReturn: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  warehouse: {
    findMany: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

describe('SalesReportService', () => {
  let service: SalesReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesReportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SalesReportService>(SalesReportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSalesSummary', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('should return zero totals when no orders exist', async () => {
      mockPrismaService.saleOrder.aggregate.mockResolvedValueOnce({
        _count: { id: 0 },
        _sum: { subtotal: 0, cartDiscountTotal: 0, grandTotal: 0 },
      });
      mockPrismaService.saleReturn.aggregate.mockResolvedValueOnce({
        _sum: { totalRefundAmount: 0 },
      });
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);
      mockPrismaService.saleOrder.groupBy.mockResolvedValueOnce([]);

      const result = await service.getSalesSummary(filter);
      expect(result.totalOrders).toBe(0);
      expect(result.netRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
      expect(result.byPaymentMethod).toEqual([]);
      expect(result.byChannel).toEqual({});
    });

    it('should aggregate orders with payments, net returns, and calculate AOV accurately', async () => {
      mockPrismaService.saleOrder.aggregate.mockResolvedValueOnce({
        _count: { id: 2 },
        _sum: { subtotal: 1500, cartDiscountTotal: 100, grandTotal: 1400 },
      });
      mockPrismaService.saleReturn.aggregate.mockResolvedValueOnce({
        _sum: { totalRefundAmount: 200 },
      });
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { method: 'CASH', count: 1, amount: 500 },
        { method: 'CREDIT_CARD', count: 1, amount: 700 },
      ]);
      mockPrismaService.saleOrder.groupBy.mockResolvedValueOnce([
        { source: 'POS', _sum: { grandTotal: 900 } },
        { source: 'STOREFRONT', _sum: { grandTotal: 500 } },
      ]);

      const result = await service.getSalesSummary(filter);
      expect(result.totalOrders).toBe(2);
      expect(result.totalRevenue).toBe(1500);
      expect(result.totalDiscounts).toBe(100);
      // Net Revenue = grandTotal (1400) - returns (200) = 1200
      expect(result.netRevenue).toBe(1200);
      // Ticket promedio = 1200 / 2 = 600
      expect(result.averageOrderValue).toBe(600);
      expect(result.byPaymentMethod).toEqual([
        { method: 'CASH', count: 1, amount: 500 },
        { method: 'CREDIT_CARD', count: 1, amount: 700 },
      ]);
      expect(result.byChannel).toEqual({ POS: 900, STOREFRONT: 500 });
    });

    it('should filter by branchId in Prisma aggregate and query', async () => {
      mockPrismaService.saleOrder.aggregate.mockResolvedValueOnce({
        _count: { id: 1 },
        _sum: { subtotal: 500, cartDiscountTotal: 0, grandTotal: 500 },
      });
      mockPrismaService.saleReturn.aggregate.mockResolvedValueOnce({
        _sum: { totalRefundAmount: 0 },
      });
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);
      mockPrismaService.saleOrder.groupBy.mockResolvedValueOnce([]);

      await service.getSalesSummary({ ...filter, branchId: 'branch-1' });

      expect(mockPrismaService.saleOrder.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-1',
          }),
        }),
      );
      expect(mockPrismaService.saleReturn.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: 'branch-1',
          }),
        }),
      );
    });
  });

  describe('getTopSellers', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('should return top sellers from SQL raw query', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        {
          variantId: 'v1',
          sku: 'SKU-1',
          name: 'Remera Negra',
          category: 'Remeras',
          totalUnitsSold: 15,
          totalRevenue: 15000,
        },
      ]);

      const result = await service.getTopSellers(filter, 5);
      expect(result).toHaveLength(1);
      expect(result[0].variantId).toBe('v1');
      expect(result[0].totalUnitsSold).toBe(15);
      expect(result[0].totalRevenue).toBe(15000);
      expect(result[0].category).toBe('Remeras');
    });
  });

  describe('getCogsReport', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('should calculate COGS, gross profit, and gross margin percentage', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { totalCOGS: 4000 },
      ]);

      // When precomputedRevenue is provided (e.g. 10000)
      const result = await service.getCogsReport(filter, 10000);
      expect(result.totalCOGS).toBe(4000);
      expect(result.totalRevenue).toBe(10000);
      expect(result.grossProfit).toBe(6000);
      expect(result.grossMarginPct).toBe(60);
    });

    it('should filter by warehouses when branchId is provided', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValueOnce([
        { id: 'w1' },
      ]);
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        { totalCOGS: 1000 },
      ]);

      await service.getCogsReport({ ...filter, branchId: 'branch-1' }, 5000);
      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        select: { id: true },
      });
    });
  });
});
