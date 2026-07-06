import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MovementType } from './enums/movement-type.enum';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService: any = {
  $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  inventoryMovement: {
    create: jest.fn().mockImplementation((data: any) => Promise.resolve({ id: 'mov1', ...data.data })),
  },
  stockLevel: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: (jest.fn() as any).mockResolvedValue({ count: 1 }),
    create: jest.fn(),
  },
};

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordMovement', () => {
    it('should throw error if GOODS_RECEIPT has no destination', async () => {
      await expect(
        service.recordMovement({
          variantId: 'v1',
          quantity: 10,
          type: MovementType.GOODS_RECEIPT,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create movement and increment stock on GOODS_RECEIPT', async () => {
      mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce(null); // No previous stock
      mockPrismaService.stockLevel.create.mockResolvedValueOnce({ id: 's1', physicalQuantity: 10 });

      const result = await service.recordMovement({
        variantId: 'v1',
        quantity: 10,
        type: MovementType.GOODS_RECEIPT,
        destinationWarehouseId: 'w1',
      });

      expect(mockPrismaService.inventoryMovement.create).toHaveBeenCalled();
      expect(mockPrismaService.stockLevel.create).toHaveBeenCalledWith({
        data: {
          variantId: 'v1',
          warehouseId: 'w1',
          batchId: null,
          physicalQuantity: 10,
          availableQuantity: 10,
        },
      });
      expect(result).toBeDefined();
    });

    it('should throw error if SALE has no source', async () => {
      await expect(
        service.recordMovement({
          variantId: 'v1',
          quantity: 2,
          type: MovementType.SALE,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if insufficient stock on SALE', async () => {
      mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce({
        id: 's1',
        physicalQuantity: 1, // Want to sell 2, but only 1 exists
      });

      await expect(
        service.recordMovement({
          variantId: 'v1',
          quantity: 2,
          type: MovementType.SALE,
          sourceWarehouseId: 'w1',
        }),
      ).rejects.toThrow('Insufficient stock');
    });

    it('should decrement stock on successful SALE', async () => {
      mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce({
        id: 's1',
        physicalQuantity: 10,
      });

      await service.recordMovement({
        variantId: 'v1',
        quantity: 2,
        type: MovementType.SALE,
        sourceWarehouseId: 'w1',
      });

      expect(mockPrismaService.stockLevel.updateMany).toHaveBeenCalledWith({
        where: {
          id: 's1',
          physicalQuantity: { gte: 2 },
        },
        data: {
          physicalQuantity: { decrement: 2 },
          availableQuantity: { decrement: 2 },
        },
      });
    });

    it('should throw error if concurrent transaction depletes stock during SALE', async () => {
      mockPrismaService.stockLevel.findFirst.mockResolvedValueOnce({
        id: 's1',
        physicalQuantity: 10,
      });
      mockPrismaService.stockLevel.updateMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        service.recordMovement({
          variantId: 'v1',
          quantity: 2,
          type: MovementType.SALE,
          sourceWarehouseId: 'w1',
        }),
      ).rejects.toThrow('Concurrent transaction conflict');
    });
  });
});
