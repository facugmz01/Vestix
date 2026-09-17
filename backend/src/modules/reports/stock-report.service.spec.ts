import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockReportService } from './stock-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  $queryRaw: jest.fn(),
  warehouse: { findMany: jest.fn() },
};

describe('StockReportService', () => {
  let service: StockReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockReportService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StockReportService>(StockReportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStockValuation', () => {
    it('should return correct valuation for stock levels', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        {
          variantId: 'v1',
          sku: 'SKU-1',
          availableQty: 10,
          reservedQty: 2,
          unitCostWac: 50,
          unitRetailPrice: 100,
          totalCostValue: 500,
          totalRetailValue: 1000,
        },
        {
          variantId: 'v2',
          sku: 'SKU-2',
          availableQty: 5,
          reservedQty: 0,
          unitCostWac: 30,
          unitRetailPrice: 60,
          totalCostValue: 150,
          totalRetailValue: 300,
        },
      ]);

      const result = await service.getStockValuation();
      expect(result.totalSKUs).toBe(2);
      expect(result.totalUnits).toBe(15);
      expect(result.totalValueAtCost).toBe(650);
      expect(result.totalValueAtRetail).toBe(1300);
      expect(result.potentialMargin).toBe(50);
      expect(result.lines).toHaveLength(2);
    });

    it('should return empty report when no stock', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([]);
      const result = await service.getStockValuation();
      expect(result.totalSKUs).toBe(0);
      expect(result.totalUnits).toBe(0);
      expect(result.totalValueAtCost).toBe(0);
      expect(result.potentialMargin).toBe(0);
    });
  });

  describe('getLowStockAlerts', () => {
    it('should return items below reorder point', async () => {
      mockPrismaService.$queryRaw.mockResolvedValueOnce([
        {
          variantId: 'v1',
          sku: 'SKU-1',
          name: 'Shirt',
          branchId: 'b1',
          availableQuantity: 2,
          reorderPoint: 5,
        },
      ]);

      const result = await service.getLowStockAlerts(undefined, 5);
      expect(result).toHaveLength(1);
      expect(result[0].variantId).toBe('v1');
      expect(result[0].availableQuantity).toBe(2);
      expect(result[0].reorderPoint).toBe(5);
    });
  });
});
