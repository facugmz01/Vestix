import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesReportService } from './sales-report.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockPrismaService: any = {
  saleOrder: { findMany: jest.fn() },
  saleReturn: { findMany: jest.fn() },
  orderLineItem: { findMany: jest.fn() },
  saleReturnLine: { findMany: jest.fn() },
  inventoryMovement: { findMany: jest.fn() },
  warehouse: { findMany: jest.fn() },
  productVariant: { findMany: (jest.fn() as any).mockResolvedValue([]) },
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
    mockPrismaService.saleReturn.findMany.mockResolvedValue([]);
    mockPrismaService.saleReturnLine.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSalesSummary', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('should return zero totals when no orders exist', async () => {
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);
      const result = await service.getSalesSummary(filter);
      expect(result.totalOrders).toBe(0);
      expect(result.netRevenue).toBe(0);
      expect(result.averageOrderValue).toBe(0);
      expect(result.byPaymentMethod).toEqual([]);
    });

    it('should aggregate orders with payments', async () => {
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
        {
          subtotal: 1000, cartDiscountTotal: 100, grandTotal: 900, source: 'POS',
          paymentMethod: null,
          payments: [
            { amount: 500, paymentMethod: { type: 'CASH' } },
            { amount: 400, paymentMethod: { type: 'CARD' } },
          ],
        },
        {
          subtotal: 500, cartDiscountTotal: 0, grandTotal: 500, source: 'ECOMMERCE',
          paymentMethod: 'TRANSFER',
          payments: [],
        },
      ]);

      const result = await service.getSalesSummary(filter);
      expect(result.totalOrders).toBe(2);
      expect(result.totalRevenue).toBe(1500);
      expect(result.totalDiscounts).toBe(100);
      expect(result.netRevenue).toBe(1400);
      expect(result.averageOrderValue).toBe(700);
      expect(result.byPaymentMethod).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: 'CASH', amount: 500 }),
          expect.objectContaining({ method: 'CARD', amount: 400 }),
          expect.objectContaining({ method: 'TRANSFER', amount: 500 }),
        ]),
      );
      expect(result.byChannel).toEqual({ POS: 900, ECOMMERCE: 500 });
    });

    it('should subtract approved returns from net revenue', async () => {
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
        {
          subtotal: 1000, cartDiscountTotal: 0, grandTotal: 1000, source: 'POS',
          paymentMethod: 'CASH', payments: [],
        },
      ]);
      mockPrismaService.saleReturn.findMany.mockResolvedValueOnce([
        { totalRefundAmount: 300 },
        { totalRefundAmount: 200 },
      ]);

      const result = await service.getSalesSummary(filter);
      expect(result.netRevenue).toBe(500);
    });

    it('should use paymentMethod field when payments array is empty', async () => {
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
        {
          subtotal: 200, cartDiscountTotal: 0, grandTotal: 200,
          source: 'POS', paymentMethod: 'CASH', payments: [],
        },
      ]);
      const result = await service.getSalesSummary(filter);
      expect(result.byPaymentMethod[0].method).toBe('CASH');
    });

    it('should only include revenue-eligible order statuses', async () => {
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);
      await service.getSalesSummary(filter);
      expect(mockPrismaService.saleOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { in: ['COMPLETED', 'CONFIRMED', 'READY_FOR_PICKUP', 'DELIVERED'] },
          }),
        }),
      );
    });
  });

  describe('getTopSellers', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('should return empty array when no line items', async () => {
      mockPrismaService.orderLineItem.findMany.mockResolvedValueOnce([]);
      const result = await service.getTopSellers(filter);
      expect(result).toEqual([]);
    });

    it('should aggregate and sort by units sold', async () => {
      mockPrismaService.orderLineItem.findMany.mockResolvedValueOnce([
        { variantId: 'v1', quantity: 5, finalPrice: 500 },
        { variantId: 'v1', quantity: 3, finalPrice: 300 },
        { variantId: 'v2', quantity: 10, finalPrice: 1000 },
      ]);
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { id: 'v1', sku: 'SKU-1', product: { name: 'Shirt' } },
        { id: 'v2', sku: 'SKU-2', product: { name: 'Pants' } },
      ]);

      const result = await service.getTopSellers(filter, 2);
      expect(result).toHaveLength(2);
      expect(result[0].variantId).toBe('v2');
      expect(result[0].totalUnitsSold).toBe(10);
      expect(result[1].variantId).toBe('v1');
      expect(result[1].totalUnitsSold).toBe(8);
      expect(result[1].totalRevenue).toBe(800);
    });

    it('should subtract returned units and revenue', async () => {
      mockPrismaService.orderLineItem.findMany.mockResolvedValueOnce([
        { variantId: 'v1', quantity: 10, finalPrice: 1000, historicalName: 'Shirt', historicalSku: 'SKU-1' },
      ]);
      mockPrismaService.saleReturnLine.findMany.mockResolvedValueOnce([
        {
          variantId: 'v1',
          quantity: 3,
          orderLine: { quantity: 10, finalPrice: 1000, historicalName: 'Shirt', historicalSku: 'SKU-1' },
        },
      ]);
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        { id: 'v1', sku: 'SKU-1', product: { name: 'Shirt' } },
      ]);

      const result = await service.getTopSellers(filter, 5);
      expect(result).toHaveLength(1);
      expect(result[0].totalUnitsSold).toBe(7);
      expect(result[0].totalRevenue).toBe(700);
    });
  });

  describe('getCogsReport', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('should calculate COGS, profit, and margin', async () => {
      mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([
        { type: 'SALE', quantity: 10, unitCost: 50 },
        { type: 'SALE', quantity: 5, unitCost: 30 },
      ]);
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
        { subtotal: 1000, cartDiscountTotal: 0, grandTotal: 1000, source: 'POS', payments: [], paymentMethod: 'CASH' },
      ]);

      const result = await service.getCogsReport(filter);
      expect(result.totalCOGS).toBe(650); // 10*50 + 5*30
      expect(result.totalRevenue).toBe(1000);
      expect(result.grossProfit).toBe(350);
      expect(result.grossMarginPct).toBe(35);
    });

    it('should subtract SALE_RETURN movements from COGS', async () => {
      mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([
        { type: 'SALE', quantity: 10, unitCost: 50 },
        { type: 'SALE_RETURN', quantity: 4, unitCost: 50 },
      ]);
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([
        { subtotal: 1000, cartDiscountTotal: 0, grandTotal: 1000, source: 'POS', payments: [], paymentMethod: 'CASH' },
      ]);

      const result = await service.getCogsReport(filter);
      expect(result.totalCOGS).toBe(300); // 500 - 200
    });

    it('should return 0 margin when no revenue', async () => {
      mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([]);
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);
      const result = await service.getCogsReport(filter);
      expect(result.grossMarginPct).toBe(0);
    });

    it('should filter by branch warehouses when branchId is provided', async () => {
      mockPrismaService.warehouse.findMany.mockResolvedValueOnce([{ id: 'w1' }, { id: 'w2' }]);
      mockPrismaService.inventoryMovement.findMany.mockResolvedValueOnce([]);
      mockPrismaService.saleOrder.findMany.mockResolvedValueOnce([]);

      await service.getCogsReport({ ...filter, branchId: 'b1' });
      expect(mockPrismaService.warehouse.findMany).toHaveBeenCalledWith({
        where: { branchId: 'b1' },
        select: { id: true },
      });
    });
  });
});
