import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PurchasingService } from './purchasing.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService: any = {
  $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  purchaseOrder: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  goodsReceipt: {
    create: jest.fn(),
  },
  pOLineItem: {
    update: jest.fn(),
  },
};

const mockInventoryService = {
  recordMovement: jest.fn(),
};

describe('PurchasingService', () => {
  let service: PurchasingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<PurchasingService>(PurchasingService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('receiveGoods', () => {
    it('should throw if PO is already completed', async () => {
      mockPrismaService.purchaseOrder.findUnique.mockResolvedValueOnce({
        id: 'po1',
        status: 'COMPLETED',
      });

      await expect(
        service.receiveGoods({ purchaseOrderId: 'po1', lines: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should receive goods and update inventory', async () => {
      mockPrismaService.purchaseOrder.findUnique.mockResolvedValueOnce({
        id: 'po1',
        status: 'ISSUED',
        destinationWarehouseId: 'w1',
        lines: [
          { id: 'l1', variantId: 'v1', orderedQuantity: 10, receivedQuantity: 0, unitCost: 100 },
        ],
      });

      mockPrismaService.goodsReceipt.create.mockResolvedValueOnce({ id: 'receipt1' });

      await service.receiveGoods({
        purchaseOrderId: 'po1',
        lines: [{ variantId: 'v1', receivedQuantity: 5 }],
      });

      expect(mockInventoryService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          variantId: 'v1',
          quantity: 5,
          type: 'GOODS_RECEIPT',
          destinationWarehouseId: 'w1',
        }),
        mockPrismaService,
      );

      expect(mockPrismaService.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'PARTIALLY_RECEIVED' },
        }),
      );
    });
  });
});
