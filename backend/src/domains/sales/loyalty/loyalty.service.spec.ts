import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { SettingsService } from '../../../modules/settings/settings.service';

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  const prisma = {
    customer: { findUnique: jest.fn() },
    loyaltyAccount: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(prisma)),
  };

  const settingsService = {
    getLoyaltySettings: jest.fn().mockResolvedValue({
      enabled: true,
      pointsPerAmount: 1,
      amountUnit: 100,
      redeemValuePerPoint: 1,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: prisma },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = module.get(LoyaltyService);
  });

  describe('calculateEarnedPoints', () => {
    it('earns 1 point per $100 by default', () => {
      expect(service.calculateEarnedPoints(250)).toBe(2);
      expect(service.calculateEarnedPoints(99)).toBe(0);
    });

    it('returns 0 when disabled', () => {
      expect(
        service.calculateEarnedPoints(500, {
          enabled: false,
          pointsPerAmount: 1,
          amountUnit: 100,
          redeemValuePerPoint: 1,
        }),
      ).toBe(0);
    });
  });

  describe('earnPointsForOrder', () => {
    it('credits points to customer account', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
      prisma.loyaltyAccount.upsert.mockResolvedValue({ id: 'acc-1', customerId: 'cust-1', points: 0 });
      prisma.loyaltyAccount.update.mockResolvedValue({ id: 'acc-1', customerId: 'cust-1', points: 5 });

      const result = await service.earnPointsForOrder('cust-1', 550, 'order-1');

      expect(result?.earned).toBe(5);
      expect(prisma.loyaltyAccount.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { points: { increment: 5 } },
      });
    });
  });

  describe('redeemPoints', () => {
    it('deducts points when balance is sufficient', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
      prisma.loyaltyAccount.upsert.mockResolvedValue({ id: 'acc-1', customerId: 'cust-1', points: 100 });
      prisma.loyaltyAccount.update.mockResolvedValue({ id: 'acc-1', customerId: 'cust-1', points: 80 });

      const result = await service.redeemPoints('cust-1', 20);

      expect(result.redeemedPoints).toBe(20);
      expect(result.redeemValue).toBe(20);
    });

    it('rejects when insufficient points', async () => {
      prisma.customer.findUnique.mockResolvedValue({ id: 'cust-1' });
      prisma.loyaltyAccount.upsert.mockResolvedValue({ id: 'acc-1', customerId: 'cust-1', points: 5 });

      await expect(service.redeemPoints('cust-1', 20)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAccount', () => {
    it('throws when account missing', async () => {
      prisma.loyaltyAccount.findUnique.mockResolvedValue(null);
      await expect(service.getAccount('cust-1')).rejects.toThrow(NotFoundException);
    });
  });
});
