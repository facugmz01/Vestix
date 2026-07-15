import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { CatalogFacade } from '../catalog/catalog.facade';
import { AfipProducer } from '../invoicing/afip.producer';
import { InventoryService } from '../logistics/inventory.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { NotificationTriggersService } from '../notifications/notification-triggers.service';
import { AccountsService } from '../finance/accounts.service';
import { LoyaltyService } from './loyalty/loyalty.service';
import { GiftCardsService } from './gift-cards/gift-cards.service';

describe('CheckoutOrchestrator.confirmQuotation', () => {
  let orchestrator: CheckoutOrchestrator;

  const txMock: any = {
    customer: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    financialTransaction: {
      count: jest.fn(),
    },
    paymentMethod: {
      findFirst: jest.fn(),
    },
    saleOrder: {
      update: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
  };

  const prismaMock: any = {
    saleOrder: { findUnique: jest.fn() },
    branch: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof txMock) => unknown) => fn(txMock)),
  };

  const inventoryServiceMock: any = {
    recordMovement: jest.fn(),
  };

  const catalogFacadeMock: any = {
    getVariantWithCombos: jest.fn(),
  };

  const afipProducerMock: any = {
    enqueueInvoiceGeneration: jest.fn(),
  };

  const notificationTriggersMock: any = {
    onSaleCompleted: jest.fn(),
    checkLowStock: jest.fn(),
  };

  const loyaltyServiceMock: any = {
    earnPointsForOrder: jest.fn(),
  };

  const accountsServiceMock: any = {
    postTransactionInTx: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutOrchestrator,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PricingService, useValue: {} },
        { provide: RulesEngineService, useValue: {} },
        { provide: CatalogFacade, useValue: catalogFacadeMock },
        { provide: AfipProducer, useValue: afipProducerMock },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: SettingsService, useValue: {} },
        { provide: NotificationTriggersService, useValue: notificationTriggersMock },
        { provide: AccountsService, useValue: accountsServiceMock },
        { provide: LoyaltyService, useValue: loyaltyServiceMock },
        { provide: GiftCardsService, useValue: {} },
      ],
    }).compile();

    orchestrator = module.get(CheckoutOrchestrator);
    jest.clearAllMocks();

    catalogFacadeMock.getVariantWithCombos.mockResolvedValue({
      id: 'var-1',
      product: { type: 'SIMPLE', comboItems: [] },
    });
    txMock.financialTransaction.count.mockResolvedValue(0);
    txMock.outboxEvent.create.mockResolvedValue({});
  });

  function stubQuote(overrides: Record<string, unknown> = {}) {
    return {
      id: 'quote-1',
      status: 'QUOTATION',
      branchId: 'branch-1',
      warehouseId: 'wh-1',
      customerId: 'cust-1',
      paymentMethod: 'CUSTOMER_CREDIT',
      grandTotal: 1500,
      issueInvoice: false,
      payments: [],
      lines: [{ variantId: 'var-1', quantity: 1, basePrice: 1000 }],
      ...overrides,
    };
  }

  it('increments customer usedCredit when confirming a CC quotation', async () => {
    const quote = stubQuote();
    prismaMock.saleOrder.findUnique.mockResolvedValue(quote);
    txMock.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      usedCredit: 200,
      creditLimit: 10000,
    });
    txMock.customer.update.mockResolvedValue({});
    txMock.saleOrder.update.mockResolvedValue({
      ...quote,
      status: 'CONFIRMED',
    });

    await orchestrator.confirmQuotation('quote-1');

    expect(txMock.customer.update).toHaveBeenCalledWith({
      where: { id: 'cust-1' },
      data: { usedCredit: { increment: 1500 } },
    });
    expect(inventoryServiceMock.recordMovement).toHaveBeenCalled();
    expect(txMock.saleOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED' } }),
    );
  });

  it('rejects confirm when CC would exceed credit limit', async () => {
    const quote = stubQuote({ grandTotal: 9000 });
    prismaMock.saleOrder.findUnique.mockResolvedValue(quote);
    txMock.customer.findUnique.mockResolvedValue({
      id: 'cust-1',
      usedCredit: 2000,
      creditLimit: 10000,
    });

    await expect(orchestrator.confirmQuotation('quote-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(txMock.customer.update).not.toHaveBeenCalled();
  });

  it('does not charge usedCredit twice if finance already posted', async () => {
    const quote = stubQuote();
    prismaMock.saleOrder.findUnique.mockResolvedValue(quote);
    txMock.financialTransaction.count.mockResolvedValue(1);
    txMock.saleOrder.update.mockResolvedValue({
      ...quote,
      status: 'CONFIRMED',
    });

    await orchestrator.confirmQuotation('quote-1');

    expect(txMock.customer.findUnique).not.toHaveBeenCalled();
    expect(txMock.customer.update).not.toHaveBeenCalled();
  });
});
