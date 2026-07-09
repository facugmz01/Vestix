import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

import { ShippingService } from './shipping.service';
import { OrderStatus } from '../sales/orders/models/fulfillment.model';
import { DeliveryStatus } from './models/delivery.model';

describe('ShippingService.applyCommercialStatus', () => {
  const mockPrisma: any = {
    orderFulfillment: {
      findUnique: jest.fn(),
      update: jest.fn(),
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
  const mockNotificationTriggers: any = {};
  const mockCourierService: any = {};

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
    );
  });

  it('advances fulfillment to PACKED when commercial status is READY_FOR_PICKUP', async () => {
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

  it('advances fulfillment to DELIVERED and syncs delivery when commercial status is DELIVERED', async () => {
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
        delivery: { id: 'del-1', status: DeliveryStatus.IN_TRANSIT },
      })
      .mockResolvedValueOnce({
        id: 'ff-2',
        status: OrderStatus.DELIVERED,
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
    expect(mockPrisma.delivery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'del-1' },
        data: { status: DeliveryStatus.DELIVERED },
      }),
    );
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
    );
  });

  it('surfaces READY_FOR_PICKUP from commercial status over fulfillment PACKED', () => {
    expect(service.resolveStorefrontStatus('READY_FOR_PICKUP', 'PACKED')).toBe('READY_FOR_PICKUP');
  });

  it('prefers fulfillment status for normal logistics progression', () => {
    expect(service.resolveStorefrontStatus('CONFIRMED', 'SHIPPED')).toBe('SHIPPED');
  });

  it('falls back to commercial status when fulfillment is missing', () => {
    expect(service.resolveStorefrontStatus('CONFIRMED', null)).toBe('CONFIRMED');
  });
});
