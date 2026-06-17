import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TransfersService } from './transfers.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService: any = {
  $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  stockTransfer: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  stockTransferLine: {
    update: jest.fn(),
  },
  productVariant: {
    findUnique: jest.fn(),
  },
};

const mockInventoryService = {
  recordMovement: jest.fn(),
};

describe('TransfersService', () => {
  let service: TransfersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransfersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
    jest.clearAllMocks();
  });

  describe('dispatchTransfer', () => {
    it('should throw if transfer is not DRAFT', async () => {
      mockPrismaService.stockTransfer.findUnique.mockResolvedValueOnce({ status: 'IN_TRANSIT' });
      await expect(service.dispatchTransfer('t1')).rejects.toThrow(BadRequestException);
    });

    it('should deduct stock and mark IN_TRANSIT', async () => {
      mockPrismaService.stockTransfer.findUnique.mockResolvedValueOnce({
        id: 't1',
        status: 'DRAFT',
        sourceWarehouseId: 'w1',
        destinationWarehouseId: 'w2',
        lines: [{ id: 'l1', variantId: 'v1', quantity: 5 }],
      });

      mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({ costPrice: 50 });

      await service.dispatchTransfer('t1');

      expect(mockInventoryService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRANSFER_OUT', quantity: 5, sourceWarehouseId: 'w1' }),
        mockPrismaService,
      );
    });
  });

  describe('receiveTransfer', () => {
    it('should add stock to destination', async () => {
      mockPrismaService.stockTransfer.findUnique.mockResolvedValueOnce({
        id: 't1',
        status: 'IN_TRANSIT',
        sourceWarehouseId: 'w1',
        destinationWarehouseId: 'w2',
        lines: [{ id: 'l1', variantId: 'v1', quantity: 5 }],
      });

      mockPrismaService.productVariant.findUnique.mockResolvedValueOnce({ costPrice: 50 });

      await service.receiveTransfer('t1', {
        lines: [{ variantId: 'v1', receivedQuantity: 5 }],
      });

      expect(mockInventoryService.recordMovement).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'TRANSFER_IN', quantity: 5, destinationWarehouseId: 'w2' }),
        mockPrismaService,
      );
      expect(mockPrismaService.stockTransferLine.update).toHaveBeenCalled();
    });
  });
});
