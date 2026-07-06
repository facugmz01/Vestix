import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { StockReportService } from './stock-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  stockLevel: { findMany: jest.fn() },
  productVariant: { findMany: (jest.fn() as any).mockResolvedValue([]) },
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
    mockPrismaService.productVariant.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStockValuation', () => {
    it('should return correct valuation for stock levels', async () => {
      mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([
        { variantId: 'v1', availableQuantity: 10, reservedQuantity: 2 },
        { variantId: 'v2', availableQuantity: 5, reservedQuantity: 0 },
      ]);
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { id: 'v1', sku: 'SKU-1', costPrice: 50, basePrice: 100, product: { name: 'Shirt' } },
        { id: 'v2', sku: 'SKU-2', costPrice: 30, basePrice: 60, product: { name: 'Pants' } },
      ]);

      const result = await service.getStockValuation();
      expect(result.totalSKUs).toBe(2);
      expect(result.totalUnits).toBe(15);
      expect(result.totalValueAtCost).toBe(650); // 10*50 + 5*30
      expect(result.totalValueAtRetail).toBe(1300); // 10*100 + 5*60
      expect(result.potentialMargin).toBe(50); // (1300-650)/1300*100
      expect(result.lines).toHaveLength(2);
    });

    it('should return empty report when no stock', async () => {
      mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([]);
      const result = await service.getStockValuation();
      expect(result.totalSKUs).toBe(0);
      expect(result.totalUnits).toBe(0);
      expect(result.totalValueAtCost).toBe(0);
      expect(result.potentialMargin).toBe(0);
    });

    it('should handle missing variant cost/price', async () => {
      mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([
        { variantId: 'v1', availableQuantity: 3, reservedQuantity: 0 },
      ]);
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { id: 'v1', sku: null, costPrice: null, basePrice: null, product: { name: 'Unknown' } },
      ]);
      const result = await service.getStockValuation();
      expect(result.totalValueAtCost).toBe(0);
      expect(result.totalValueAtRetail).toBe(0);
      expect(result.lines[0].sku).toBe('Unknown');
    });

    it('should apply branch filter when branchId is provided', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValueOnce([{ id: 'w1' }, { id: 'w2' }]);
      mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([]);
      await service.getStockValuation('b1');
      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith({ where: { branchId: 'b1' } });
      expect(mockPrismaService.stockLevel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { warehouseId: { in: ['w1', 'w2'] } },
        }),
      );
    });
  });

  describe('getLowStockAlerts', () => {
    it('should return items below reorder point', async () => {
      mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([
        { variantId: 'v1', availableQuantity: 2, branchId: 'b1' },
      ]);
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { id: 'v1', sku: 'SKU-1', product: { name: 'Shirt' } },
      ]);

      const result = await service.getLowStockAlerts(undefined, 5);
      expect(result).toHaveLength(1);
      expect(result[0].variantId).toBe('v1');
      expect(result[0].availableQuantity).toBe(2);
      expect(result[0].reorderPoint).toBe(5);
      expect(result[0].branchId).toBe('b1');
    });

    it('should use default reorder point of 5', async () => {
      mockPrismaService.stockLevel.findMany.mockResolvedValueOnce([]);
      await service.getLowStockAlerts();
      expect(mockPrismaService.stockLevel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availableQuantity: { lte: 5 },
          }),
        }),
      );
    });
  });
});
