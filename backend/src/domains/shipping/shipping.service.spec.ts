import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

import { BadRequestException } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { OrderStatus } from '../sales/orders/models/fulfillment.model';
import { DeliveryStatus } from './models/delivery.model';

describe('ShippingService.applyCommercialStatus', () => {
  const mockPrisma: any = {
    orderFulfillment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    saleOrder: {
      findUnique: jest.fn(),
    },
    delivery: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (fn: any) => fn(mockPrisma)),
  };

  const mockFulfillmentService: any = {};
  const mockValidationService: any = {};
  const mockSettingsService: any = {};
  const mockGeocodingService: any = {};
  const mockNotificationTriggers: any = {
    onOrderDelivered: jest.fn(),
  };
  const mockCourierService: any = {};
  const mockCatalogFacade: any = {
    getVariantsDetails: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
  };

  let service: ShippingService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
    service = new ShippingService(
      mockPrisma,
      mockFulfillmentService,
      mockValidationService,
      mockSettingsService,
      mockGeocodingService,
      mockNotificationTriggers,
      mockCourierService,
      mockCatalogFacade,
    );
  });

  it('advances fulfillment to PACKED when commercial status is READY_FOR_PICKUP (pickup)', async () => {
    mockPrisma.orderFulfillment.findUnique
      .mockResolvedValueOnce({
        id: 'ff-1',
        saleOrderId: 'sale-1',
        status: OrderStatus.PAID,
        paidAt: new Date('2026-01-01'),
        pickedAt: null,
        packedAt: null,
        shippedAt: null,
        deliveredAt: null,
        delivery: null,
      })
      .mockResolvedValueOnce({
        id: 'ff-1',
        status: OrderStatus.PACKED,
      });
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'sale-1',
      shippingAddress: null,
    });

    await service.applyCommercialStatus('sale-1', 'READY_FOR_PICKUP');

    expect(mockPrisma.orderFulfillment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ff-1' },
        data: expect.objectContaining({
          status: OrderStatus.PACKED,
          pickedAt: expect.any(Date),
          packedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('rejects READY_FOR_PICKUP for home-delivery orders', async () => {
    mockPrisma.orderFulfillment.findUnique.mockResolvedValueOnce({
      id: 'ff-home',
      saleOrderId: 'sale-home',
      status: OrderStatus.PAID,
      delivery: null,
    });
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'sale-home',
      shippingAddress: { address: 'Calle 1' },
    });

    await expect(service.applyCommercialStatus('sale-home', 'READY_FOR_PICKUP')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockPrisma.orderFulfillment.update).not.toHaveBeenCalled();
  });

  it('rejects DELIVERED for home-delivery orders (must use shipping module)', async () => {
    mockPrisma.orderFulfillment.findUnique.mockResolvedValueOnce({
      id: 'ff-home-2',
      saleOrderId: 'sale-home-2',
      status: OrderStatus.SHIPPED,
      delivery: { id: 'del-1', status: DeliveryStatus.IN_TRANSIT },
    });
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'sale-home-2',
      shippingAddress: { address: 'Calle 1' },
    });

    await expect(service.applyCommercialStatus('sale-home-2', 'DELIVERED')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(mockPrisma.orderFulfillment.update).not.toHaveBeenCalled();
  });

  it('advances pickup fulfillment to DELIVERED without setting shippedAt', async () => {
    mockPrisma.orderFulfillment.findUnique
      .mockResolvedValueOnce({
        id: 'ff-2',
        saleOrderId: 'sale-2',
        status: OrderStatus.PACKED,
        paidAt: new Date('2026-01-01'),
        pickedAt: new Date('2026-01-01'),
        packedAt: new Date('2026-01-01'),
        shippedAt: null,
        deliveredAt: null,
        delivery: null,
      })
      .mockResolvedValueOnce({
        id: 'ff-2',
        status: OrderStatus.DELIVERED,
      });
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'sale-2',
      shippingAddress: null,
    });

    await service.applyCommercialStatus('sale-2', 'DELIVERED');

    expect(mockPrisma.orderFulfillment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ff-2' },
        data: expect.objectContaining({
          status: OrderStatus.DELIVERED,
          deliveredAt: expect.any(Date),
        }),
      }),
    );
    const updateData = mockPrisma.orderFulfillment.update.mock.calls[0][0].data;
    expect(updateData.shippedAt).toBeUndefined();
    expect(mockNotificationTriggers.onOrderDelivered).toHaveBeenCalledWith('sale-2');
  });

  it('does not regress fulfillment when commercial status maps to an earlier step', async () => {
    mockPrisma.orderFulfillment.findUnique.mockResolvedValueOnce({
      id: 'ff-3',
      saleOrderId: 'sale-3',
      status: OrderStatus.SHIPPED,
      paidAt: new Date(),
      pickedAt: new Date(),
      packedAt: new Date(),
      shippedAt: new Date(),
      deliveredAt: null,
      delivery: null,
    });
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'sale-3',
      shippingAddress: null,
    });

    const result = await service.applyCommercialStatus('sale-3', 'READY_FOR_PICKUP');

    expect(mockPrisma.orderFulfillment.update).not.toHaveBeenCalled();
    expect(result?.status).toBe(OrderStatus.SHIPPED);
  });

  it('returns null when there is no fulfillment record', async () => {
    mockPrisma.orderFulfillment.findUnique.mockResolvedValueOnce(null);
    const result = await service.applyCommercialStatus('sale-missing', 'DELIVERED');
    expect(result).toBeNull();
    expect(mockPrisma.orderFulfillment.update).not.toHaveBeenCalled();
  });
});

describe('ShippingService.resolveStorefrontStatus', () => {
  let service: ShippingService;

  beforeEach(() => {
    service = new ShippingService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  });

  it('surfaces READY_FOR_PICKUP from commercial status over fulfillment PACKED', () => {
    expect(service.resolveStorefrontStatus('READY_FOR_PICKUP', 'PACKED')).toBe('READY_FOR_PICKUP');
  });

  it('prefers fulfillment status for normal logistics progression', () => {
    expect(service.resolveStorefrontStatus('CONFIRMED', 'SHIPPED')).toBe('SHIPPED');
  });

  it('falls back to commercial SHIPPED when fulfillment is missing', () => {
    expect(service.resolveStorefrontStatus('SHIPPED', null)).toBe('SHIPPED');
  });

  it('falls back to commercial status when fulfillment is missing', () => {
    expect(service.resolveStorefrontStatus('CONFIRMED', null)).toBe('CONFIRMED');
  });
});
