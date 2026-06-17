import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService: any = {
  $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  productVariant: {
    findUnique: jest.fn(),
  },
  saleOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  saleOrderVariance: {
    create: jest.fn(),
  },
};

const mockInventoryService = {
  recordMovement: jest.fn(),
};

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSale', () => {
    it('should throw if variant not found', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createSale({
          branchId: 'b1',
          warehouseId: 'w1',
          posGrandTotal: 100,
          lines: [{ variantId: 'v1', quantity: 1, unitPriceOverride: 100 }],
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a sale and deduct inventory', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({
        id: 'v1',
        sku: 'SKU1',
        costPrice: 50,
        basePrice: 50,
        product: { name: 'Prod1', categoryId: 'c1' },
      });

      mockPrismaService.saleOrder.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.saleOrder.create.mockResolvedValueOnce({ id: 'order1' });

      await service.createSale({
        branchId: 'b1',
        warehouseId: 'w1',
        posGrandTotal: 100,
        lines: [{ variantId: 'v1', quantity: 2, unitPriceOverride: 50 }],
      } as any);

      expect(mockInventoryService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          variantId: 'v1',
          quantity: 2,
          type: 'SALE',
        }),
        mockPrismaService,
      );
      expect(mockPrismaService.saleOrder.create).toHaveBeenCalled();
      expect(mockPrismaService.saleOrderVariance.create).not.toHaveBeenCalled(); // 2 * 50 = 100, posTotal is 100
    });

    it('should create variance if posTotal differs', async () => {
      mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({
        id: 'v1',
        sku: 'SKU1',
        costPrice: 50,
        basePrice: 100,
        product: { name: 'Prod1', categoryId: 'c1' },
      });

      mockPrismaService.saleOrder.findUnique.mockResolvedValueOnce(null);
      mockPrismaService.saleOrder.create.mockResolvedValueOnce({ id: 'order1' });

      await service.createSale({
        branchId: 'b1',
        warehouseId: 'w1',
        posGrandTotal: 90, // POS computed 90, but server calculates 100 (1 * 100)
        lines: [{ variantId: 'v1', quantity: 1, unitPriceOverride: 100 }],
      } as any);

      expect(mockPrismaService.saleOrderVariance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            posTotal: 90,
            serverTotal: 100,
            difference: 10,
          }),
        }),
      );
    });
  });
});
