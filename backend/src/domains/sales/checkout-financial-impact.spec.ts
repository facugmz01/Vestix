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
import { OrderSource, PaymentMethod } from './models/order.model';

describe('CheckoutOrchestrator Financial Impact & Atomicity', () => {
  let orchestrator: CheckoutOrchestrator;

  const txMock: any = {
    saleOrder: {
      create: jest.fn(),
      update: jest.fn(),
    },
    saleOrderPayment: {
      create: jest.fn(),
    },
    treasuryReceipt: {
      create: jest.fn(),
    },
    financialTransaction: {
      count: jest.fn(),
      create: jest.fn(),
    },
    financialAccount: {
      update: jest.fn(),
    },
    paymentMethod: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    cashShift: {
      findUnique: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    outboxEvent: {
      create: jest.fn(),
    },
  };

  const prismaMock: any = {
    saleOrder: { findUnique: jest.fn() },
    productVariant: { findUnique: jest.fn() },
    cashShift: { findUnique: jest.fn() },
    branch: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof txMock) => unknown) => fn(txMock)),
  };

  const pricingServiceMock: any = {
    resolvePrice: jest.fn(),
  };

  const rulesEngineMock: any = {
    evaluateCartPromotions: jest.fn(),
  };

  const catalogFacadeMock: any = {
    getVariantWithCombos: jest.fn(),
  };

  const inventoryServiceMock: any = {
    recordMovement: jest.fn(),
    reserveStock: jest.fn(),
    consumeReservation: jest.fn(),
  };

  const settingsServiceMock: any = {
    getPosSettings: jest.fn(),
    getPricingSettings: jest.fn(),
    getInvoicingSettings: jest.fn(),
  };

  const notificationTriggersMock: any = {
    onSaleCompleted: jest.fn(),
    checkLowStock: jest.fn(),
  };

  const loyaltyServiceMock: any = {
    getSettings: jest.fn(),
    getOrCreateAccount: jest.fn(),
    previewRedeemValue: jest.fn(),
    earnPointsForOrder: jest.fn(),
  };

  const accountsServiceMock: any = {
    resolvePaymentAccountInTx: jest.fn(),
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
        { provide: PricingService, useValue: pricingServiceMock },
        { provide: RulesEngineService, useValue: rulesEngineMock },
        { provide: CatalogFacade, useValue: catalogFacadeMock },
        { provide: AfipProducer, useValue: { enqueueInvoiceGeneration: jest.fn() } },
        { provide: InventoryService, useValue: inventoryServiceMock },
        { provide: SettingsService, useValue: settingsServiceMock },
        { provide: NotificationTriggersService, useValue: notificationTriggersMock },
        { provide: AccountsService, useValue: accountsServiceMock },
        { provide: CurrentAccountsService, useValue: currentAccountsServiceMock },
        { provide: LoyaltyService, useValue: loyaltyServiceMock },
        { provide: GiftCardsService, useValue: { getBalance: jest.fn() } },
      ],
    }).compile();

    orchestrator = module.get(CheckoutOrchestrator);
    jest.clearAllMocks();

    settingsServiceMock.getPosSettings.mockResolvedValue({ boxMode: 'FLEXIBLE' });
    settingsServiceMock.getPricingSettings.mockResolvedValue({ allowManualDiscount: true, vatDefaultPct: 21 });
    settingsServiceMock.getInvoicingSettings.mockResolvedValue({ autoIssueOnSale: false });

    prismaMock.saleOrder.findUnique.mockResolvedValue(null);
    prismaMock.productVariant.findUnique.mockResolvedValue({
      id: 'var-1',
      sku: 'SKU-001',
      basePrice: 5000,
      costPrice: 2500,
      product: { categoryId: 'cat-1', name: 'Remera Vestix' },
    });
    pricingServiceMock.resolvePrice.mockResolvedValue(5000);
    rulesEngineMock.evaluateCartPromotions.mockResolvedValue({
      originalTotal: 5000,
      discountTotal: 0,
      finalTotal: 5000,
      appliedPromotions: [],
      lines: [{ promotionalDiscount: 0 }],
    });
    catalogFacadeMock.getVariantWithCombos.mockResolvedValue({
      id: 'var-1',
      product: { type: 'SINGLE' },
    });

    txMock.saleOrder.create.mockImplementation((args: any) => Promise.resolve({ id: args.data.id, ...args.data }));
    txMock.saleOrder.update.mockImplementation((args: any) => Promise.resolve({ id: args.where.id, ...args.data }));
    txMock.paymentMethod.findFirst.mockResolvedValue({ id: 'pm-cash-1', type: 'CASH', accountId: 'acc-cash-1' });
    accountsServiceMock.resolvePaymentAccountInTx.mockResolvedValue('acc-cash-1');
  });

  it('atomically posts financial transaction (DEBIT) and links account when POS cash sale completes', async () => {
    prismaMock.cashShift.findUnique.mockResolvedValue({
      id: 'shift-1',
      status: 'OPEN',
      openedByUserId: 'user-1',
    });

    const dto: any = {
      id: 'order-1',
      branchId: 'branch-1',
      warehouseId: 'wh-1',
      source: OrderSource.POS,
      paymentMethod: PaymentMethod.CASH,
      cashShiftId: 'shift-1',
      lines: [{ variantId: 'var-1', quantity: 1 }],
      posGrandTotal: 5000,
    };

    const result = await orchestrator.processCheckout(dto, 'user-1');

    expect(result.status).toBe('SUCCESS');
    expect(accountsServiceMock.resolvePaymentAccountInTx).toHaveBeenCalledWith(
      txMock,
      'branch-1',
      'CASH',
      'shift-1',
      undefined,
    );
    expect(accountsServiceMock.postTransactionInTx).toHaveBeenCalledWith(
      txMock,
      'acc-cash-1',
      'DEBIT',
      5000,
      'order-1',
      expect.stringContaining('via CASH'),
    );
    expect(txMock.saleOrderPayment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-1',
          paymentMethodId: 'pm-cash-1',
          amount: 5000,
        }),
      }),
    );
    expect(txMock.saleOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-1' },
        data: { financialAccountId: 'acc-cash-1' },
      }),
    );
  });

  it('atomically processes split payments (CASH + CREDIT_CARD) impacting corresponding accounts', async () => {
    prismaMock.cashShift.findUnique.mockResolvedValue({
      id: 'shift-1',
      status: 'OPEN',
      openedByUserId: 'user-1',
    });

    accountsServiceMock.resolvePaymentAccountInTx
      .mockResolvedValueOnce('acc-cash-1')
      .mockResolvedValueOnce('acc-bank-1');

    txMock.paymentMethod.findFirst
      .mockResolvedValueOnce({ id: 'pm-cash-1', type: 'CASH', accountId: 'acc-cash-1' })
      .mockResolvedValueOnce({ id: 'pm-card-1', type: 'CREDIT_CARD', accountId: 'acc-bank-1' });

    const dto: any = {
      id: 'order-split-1',
      branchId: 'branch-1',
      warehouseId: 'wh-1',
      source: OrderSource.POS,
      paymentMethod: 'MULTIPLE',
      cashShiftId: 'shift-1',
      lines: [{ variantId: 'var-1', quantity: 1 }],
      posGrandTotal: 5000,
      payments: [
        { method: 'CASH', amount: 3000 },
        { method: 'CREDIT_CARD', amount: 2000, reference: 'CUPON-123' },
      ],
    };

    const result = await orchestrator.processCheckout(dto, 'user-1');

    expect(result.status).toBe('SUCCESS');
    expect(accountsServiceMock.postTransactionInTx).toHaveBeenCalledTimes(2);
    expect(accountsServiceMock.postTransactionInTx).toHaveBeenNthCalledWith(
      1,
      txMock,
      'acc-cash-1',
      'DEBIT',
      3000,
      'order-split-1',
      expect.stringContaining('via CASH'),
    );
    expect(accountsServiceMock.postTransactionInTx).toHaveBeenNthCalledWith(
      2,
      txMock,
      'acc-bank-1',
      'DEBIT',
      2000,
      'order-split-1',
      expect.stringContaining('via CREDIT_CARD Ref: CUPON-123'),
    );
    expect(txMock.saleOrderPayment.create).toHaveBeenCalledTimes(2);
  });

  it('rejects POS sale if cash shift is missing or closed', async () => {
    prismaMock.cashShift.findUnique.mockResolvedValue({
      id: 'shift-closed',
      status: 'CLOSED',
    });

    const dto: any = {
      id: 'order-fail',
      branchId: 'branch-1',
      warehouseId: 'wh-1',
      source: OrderSource.POS,
      paymentMethod: PaymentMethod.CASH,
      cashShiftId: 'shift-closed',
      lines: [{ variantId: 'var-1', quantity: 1 }],
      posGrandTotal: 5000,
    };

    await expect(orchestrator.processCheckout(dto, 'user-1')).rejects.toThrow(BadRequestException);
  });
});
