import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { TreasuryService } from './treasury.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService: any = {
  $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  cashShift: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('TreasuryService', () => {
  let service: TreasuryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreasuryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TreasuryService>(TreasuryService);
    jest.clearAllMocks();
  });

  describe('openShift', () => {
    it('should throw if user has open shift', async () => {
      mockPrismaService.cashShift.findFirst.mockResolvedValueOnce({ id: 's1', status: 'OPEN' });
      await expect(service.openShift({ cashRegisterId: 'r1', openingAmount: 100 }, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should create an open shift', async () => {
      mockPrismaService.cashShift.findFirst.mockResolvedValue(null);
      mockPrismaService.cashShift.create.mockResolvedValueOnce({ id: 's1' });

      await service.openShift({ cashRegisterId: 'r1', openingAmount: 100 }, 'u1');

      expect(mockPrismaService.cashShift.create).toHaveBeenCalledWith({
        data: {
          cashRegisterId: 'r1',
          openedByUserId: 'u1',
          openingAmount: 100,
          status: 'OPEN',
        },
      });
    });
  });

  describe('closeShift', () => {
    it('should calculate difference correctly', async () => {
      mockPrismaService.cashShift.findUnique.mockResolvedValueOnce({
        id: 's1',
        status: 'OPEN',
        openedByUserId: 'u1',
        openingAmount: 1000,
        sales: [
          { paymentMethod: 'CASH', grandTotal: 500 },
          { paymentMethod: 'CREDIT_CARD', grandTotal: 200 },
        ]
      });

      await service.closeShift({ shiftId: 's1', closingAmount: 1400 }, 'u1');

      // Expected = 1000 + 500 = 1500
      // Difference = 1400 - 1500 = -100
      expect(mockPrismaService.cashShift.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'CLOSED',
            expectedAmount: 1500,
            difference: -100,
            closingAmount: 1400,
          })
        })
      );
    });
  });
});
