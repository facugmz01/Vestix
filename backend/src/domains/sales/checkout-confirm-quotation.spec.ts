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
import { CurrentAccountsService } from '../finance/current-accounts.service';
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
    currentAccountMovement: {
      count: jest.fn(),
      findFirst: jest.fn(),
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

  const currentAccountsServiceMock: any = {
    chargeCustomerSaleInTx: jest.fn(),
    reverseCustomerSaleInTx: jest.fn(),
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
        { provide: CurrentAccountsService, useValue: currentAccountsServiceMock },
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
    currentAccountsServiceMock.chargeCustomerSaleInTx.mockResolvedValue({});
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

  it('charges customer credit (balance + CC movement) when confirming a CC quotation', async () => {
    const quote = stubQuote();
    prismaMock.saleOrder.findUnique.mockResolvedValue(quote);
    txMock.saleOrder.update.mockResolvedValue({
      ...quote,
      status: 'CONFIRMED',
    });

    await orchestrator.confirmQuotation('quote-1');

    expect(currentAccountsServiceMock.chargeCustomerSaleInTx).toHaveBeenCalledWith(
      txMock,
      {
        customerId: 'cust-1',
        amount: 1500,
        orderId: 'quote-1',
      },
    );
    expect(inventoryServiceMock.recordMovement).toHaveBeenCalled();
    expect(txMock.saleOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'CONFIRMED' } }),
    );
  });

  it('rejects confirm when CC charge fails (e.g. credit limit)', async () => {
    const quote = stubQuote({ grandTotal: 9000 });
    prismaMock.saleOrder.findUnique.mockResolvedValue(quote);
    currentAccountsServiceMock.chargeCustomerSaleInTx.mockRejectedValue(
      new BadRequestException('Credit limit exceeded'),
    );

    await expect(orchestrator.confirmQuotation('quote-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('relies on chargeCustomerSaleInTx idempotency when finance already posted', async () => {
    const quote = stubQuote();
    prismaMock.saleOrder.findUnique.mockResolvedValue(quote);
    txMock.saleOrder.update.mockResolvedValue({
      ...quote,
      status: 'CONFIRMED',
    });
    // chargeCustomerSaleInTx itself is idempotent; still invoked, but no double-post inside
    currentAccountsServiceMock.chargeCustomerSaleInTx.mockResolvedValue({ id: 'existing-mov' });

    await orchestrator.confirmQuotation('quote-1');

    expect(currentAccountsServiceMock.chargeCustomerSaleInTx).toHaveBeenCalledTimes(1);
  });
});
