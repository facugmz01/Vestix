import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { AccountsService } from '../../finance/accounts.service';
import { SettingsService } from '../../../modules/settings/settings.service';

describe('GiftCardsService', () => {
  let service: GiftCardsService;

  const giftCard = {
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  const customer = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  const financialAccount = {
    findUnique: jest.fn(),
  };

  const prisma: {
    giftCard: typeof giftCard;
    customer: typeof customer;
    financialAccount: typeof financialAccount;
    $transaction: jest.Mock;
  } = {
    giftCard,
    customer,
    financialAccount,
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };

  const accountsService = {
    postTransactionInTx: jest.fn(),
  };

  const settingsService = {
    getGiftCardsSettings: jest.fn(),
    updateSection: jest.fn(),
  };

  const issueDto = {
    amount: 5000,
    fundingType: 'INCOME' as const,
    accountId: 'acc-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GiftCardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AccountsService, useValue: accountsService },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = module.get(GiftCardsService);
    prisma.financialAccount.findUnique.mockResolvedValue({ id: 'acc-1', isActive: true });
  });

  it('issues a gift card with generated code and income movement', async () => {
    prisma.giftCard.findUnique.mockResolvedValue(null);
    prisma.giftCard.create.mockImplementation(({ data, include }) =>
      Promise.resolve({
        id: 'gc-1',
        ...data,
        customer: null,
        include,
      }),
    );

    const result = await service.issue(issueDto);

    expect(result.balance).toBe(5000);
    expect(result.code).toMatch(/^[A-F0-9]+$/);
    expect(accountsService.postTransactionInTx).toHaveBeenCalledWith(
      prisma,
      'acc-1',
      'DEBIT',
      5000,
      'GC-gc-1',
      expect.stringContaining('Ingreso — Venta gift card'),
    );
  });

  it('records expense movement when funding type is EXPENSE', async () => {
    prisma.giftCard.findUnique.mockResolvedValue(null);
    prisma.giftCard.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'gc-2', ...data, customer: null }),
    );

    await service.issue({
      ...issueDto,
      fundingType: 'EXPENSE',
      fundingNotes: 'Campaña verano',
    });

    expect(accountsService.postTransactionInTx).toHaveBeenCalledWith(
      prisma,
      'acc-1',
      'CREDIT',
      5000,
      'GC-gc-2',
      expect.stringContaining('Sin ingreso de efectivo'),
    );
  });

  it('creates a new customer when newCustomer is provided', async () => {
    prisma.giftCard.findUnique.mockResolvedValue(null);
    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.customer.create.mockResolvedValue({ id: 'cust-1', fullName: 'Ana López' });
    prisma.giftCard.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'gc-3', ...data, customer: { id: 'cust-1', fullName: 'Ana López' } }),
    );

    const result = await service.issue({
      ...issueDto,
      newCustomer: { fullName: 'Ana López', email: 'ana@example.com' },
    });

    expect(prisma.customer.create).toHaveBeenCalled();
    expect(result.customerId).toBe('cust-1');
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

  it('verifies card by token', async () => {
    prisma.giftCard.findUnique.mockResolvedValue({
      id: 'gc-1',
      code: 'ABC123',
      balance: 3000,
      initialBalance: 5000,
      expiresAt: null,
      isActive: true,
      issuedTo: 'Juan',
      createdAt: new Date('2026-01-01'),
      fundingType: 'INCOME',
      customer: null,
    });

    const result = await service.verifyByToken('token-1');
    expect(result.valid).toBe(true);
    expect(result.code).toBe('ABC123');
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

  it('lists gift cards with optional search', async () => {
    prisma.giftCard.findMany.mockResolvedValue([{ id: 'gc-1', code: 'ABC123' }]);

    const result = await service.findAll('abc');

    expect(prisma.giftCard.findMany).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('throws when card not found', async () => {
    prisma.giftCard.findUnique.mockResolvedValue(null);
    await expect(service.getBalance('MISSING')).rejects.toThrow(NotFoundException);
  });
});
