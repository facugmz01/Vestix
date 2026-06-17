import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ConflictException } from '@nestjs/common';

const mockPrismaService: any = {
  product: {
    create: jest.fn(),
  },
  productVariant: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  productBarcode: {
    create: jest.fn(),
  },
};

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    it('should throw ConflictException on P2002 error', async () => {
      mockPrismaService.product.create.mockRejectedValueOnce({ code: 'P2002' });
      await expect(
        service.createProduct({ name: 'Test', categoryId: 'c1' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllForPos', () => {
    it('should flatten nested relations properly', async () => {
      mockPrismaService.productVariant.findMany.mockResolvedValueOnce([
        {
          id: 'v1',
          sku: 'SKU-01',
          barcode: '123456',
          basePrice: 100,
          size: 'M',
          color: 'Red',
          product: { id: 'p1', name: 'T-Shirt', categoryId: 'c1' },
          barcodes: [{ barcode: '098765' }],
        },
      ]);

      const result = await service.findAllForPos();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'v1',
        productId: 'p1',
        name: 'T-Shirt',
        categoryId: 'c1',
        sku: 'SKU-01',
        primaryBarcode: '123456',
        allBarcodes: ['123456', '098765'],
        price: 100,
        size: 'M',
        color: 'Red',
      });
    });
  });
});
