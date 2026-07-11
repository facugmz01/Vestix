import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { PrismaService } from '../../../core/prisma/prisma.service';

describe('GiftCardsService', () => {
  let service: GiftCardsService;

  const giftCard = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  const prisma = {
    giftCard,
    $transaction: jest.fn((fn: (tx: { giftCard: typeof giftCard }) => Promise<unknown>) =>
      fn({ giftCard }),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftCardsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(GiftCardsService);
  });

  it('issues a gift card with generated code', async () => {
    prisma.giftCard.findUnique.mockResolvedValue(null);
    prisma.giftCard.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'gc-1', ...data }),
    );

    const result = await service.issue({ amount: 5000 });

    expect(result.balance).toBe(5000);
    expect(result.code).toMatch(/^[A-F0-9]+$/);
    expect(prisma.giftCard.create).toHaveBeenCalled();
  });

  it('returns balance for active card', async () => {
    prisma.giftCard.findUnique.mockResolvedValue({
      id: 'gc-1',
      code: 'ABC123',
      balance: 3000,
      expiresAt: null,
      isActive: true,
    });

    const result = await service.getBalance('abc123');
    expect(result.balance).toBe(3000);
  });

  it('redeems amount from balance', async () => {
    prisma.giftCard.findUnique.mockResolvedValue({
      id: 'gc-1',
      code: 'ABC123',
      balance: 1000,
      expiresAt: null,
      isActive: true,
    });
    prisma.giftCard.updateMany.mockResolvedValue({ count: 1 });
    prisma.giftCard.findUniqueOrThrow.mockResolvedValue({
      id: 'gc-1',
      code: 'ABC123',
      balance: 700,
    });

    const result = await service.redeem({ code: 'ABC123', amount: 300 });
    expect(result.redeemedAmount).toBe(300);
    expect(result.remainingBalance).toBe(700);
  });

  it('rejects redeem when balance insufficient', async () => {
    prisma.giftCard.findUnique.mockResolvedValue({
      id: 'gc-1',
      code: 'ABC123',
      balance: 100,
      expiresAt: null,
      isActive: true,
    });
    prisma.giftCard.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.redeem({ code: 'ABC123', amount: 300 })).rejects.toThrow(BadRequestException);
  });

  it('rejects expired cards', async () => {
    prisma.giftCard.findUnique.mockResolvedValue({
      id: 'gc-1',
      code: 'ABC123',
      balance: 1000,
      expiresAt: new Date('2020-01-01'),
      isActive: true,
    });

    await expect(service.getBalance('ABC123')).rejects.toThrow(BadRequestException);
  });

  it('throws when card not found', async () => {
    prisma.giftCard.findUnique.mockResolvedValue(null);
    await expect(service.getBalance('MISSING')).rejects.toThrow(NotFoundException);
  });
});
