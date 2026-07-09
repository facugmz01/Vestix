import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

import { SalesService } from './sales.service';
import { DEFAULT_RECEIPT_STYLE } from './models/receipt-style.model';

describe('SalesService.getOrderById', () => {
  const mockRepository: any = {
    findById: jest.fn(),
  };
  const mockCatalogFacade: any = {
    getVariantsDetails: jest.fn(),
  };
  const mockPrisma: any = {};
  const mockSettingsService: any = {
    getPosSettings: (jest.fn() as any).mockResolvedValue({ receiptStyle: DEFAULT_RECEIPT_STYLE }),
  };

  let service: SalesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SalesService(mockPrisma, mockRepository, mockCatalogFacade, mockSettingsService);
  });

  it('maps productName and variantSku from historical fields and live catalog', async () => {
    mockRepository.findById.mockResolvedValueOnce({
      id: 'sale-1',
      customer: { fullName: 'Ana García' },
      lines: [
        {
          id: 'line-1',
          variantId: 'variant-1',
          historicalName: 'Remera Histórica',
          historicalSku: 'SKU-HIST',
          quantity: 1,
          basePrice: 1000,
          discountAmount: 0,
          finalPrice: 1000,
        },
        {
          id: 'line-2',
          variantId: 'variant-2',
          historicalName: null,
          historicalSku: null,
          quantity: 2,
          basePrice: 500,
          discountAmount: 0,
          finalPrice: 1000,
        },
      ],
    });

    mockCatalogFacade.getVariantsDetails.mockResolvedValueOnce([
      {
        id: 'variant-1',
        sku: 'SKU-LIVE-1',
        product: { name: 'Remera Live' },
      },
      {
        id: 'variant-2',
        sku: 'SKU-LIVE-2',
        product: { name: 'Pantalón Live' },
      },
    ]);

    const order: any = await service.getOrderById('sale-1');

    expect(order.customerName).toBe('Ana García');
    expect(order.lines[0].productName).toBe('Remera Histórica');
    expect(order.lines[0].variantSku).toBe('SKU-HIST');
    expect(order.lines[1].productName).toBe('Pantalón Live');
    expect(order.lines[1].variantSku).toBe('SKU-LIVE-2');
  });

  it('falls back gracefully when variant is missing', async () => {
    mockRepository.findById.mockResolvedValueOnce({
      id: 'sale-2',
      customer: null,
      lines: [
        {
          id: 'line-1',
          variantId: 'missing-variant',
          historicalName: null,
          historicalSku: null,
          quantity: 1,
          basePrice: 100,
          discountAmount: 0,
          finalPrice: 100,
        },
      ],
    });
    mockCatalogFacade.getVariantsDetails.mockResolvedValueOnce([]);

    const order: any = await service.getOrderById('sale-2');

    expect(order.customerName).toBe('Consumidor Final');
    expect(order.lines[0].productName).toBeNull();
    expect(order.lines[0].variantSku).toBeNull();
  });

  it('returns a public receipt when token is valid', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const orderId = 'sale-public-1';
    const token = require('./utils/receipt-access.util').generateReceiptAccessToken(orderId);

    mockRepository.findById.mockResolvedValueOnce({
      id: orderId,
      branchId: 'branch-1',
      source: 'POS',
      status: 'COMPLETED',
      customer: { fullName: 'Juan Pérez' },
      subtotal: 1000,
      cartDiscountTotal: 0,
      grandTotal: 1000,
      paymentMethod: 'CASH',
      createdAt: new Date('2026-01-01T12:00:00Z'),
      lines: [
        {
          id: 'line-1',
          variantId: 'variant-1',
          historicalName: 'Remera',
          historicalSku: 'SKU-1',
          quantity: 1,
          basePrice: 1000,
          discountAmount: 0,
          finalPrice: 1000,
        },
      ],
    });
    mockCatalogFacade.getVariantsDetails.mockResolvedValueOnce([]);
    (mockPrisma as any).branch = {
      findUnique: (jest.fn() as any).mockResolvedValueOnce({
        settings: { posReceiptHeader: 'RO Indumentaria', posReceiptFooter: 'Gracias' },
      }),
    };

    const receipt = await service.getPublicReceipt(orderId, token);

    expect(receipt.customerName).toBe('Juan Pérez');
    expect(receipt.lines[0].productName).toBe('Remera');
    expect(receipt.branchSettings.posReceiptHeader).toBe('RO Indumentaria');
    expect(receipt.receiptStyle?.paperWidthMm).toBe(80);
  });
});
