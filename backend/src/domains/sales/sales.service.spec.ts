import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

import { SalesService } from './sales.service';

describe('SalesService.getOrderById', () => {
  const mockRepository: any = {
    findById: jest.fn(),
  };
  const mockCatalogFacade: any = {
    getVariantsDetails: jest.fn(),
  };
  const mockPrisma: any = {};

  let service: SalesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SalesService(mockPrisma, mockRepository, mockCatalogFacade);
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
});
