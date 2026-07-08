import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationTriggersService } from './notification-triggers.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';
import { NotificationsService } from './notifications.service';
import { StaffInboxService } from './staff-inbox.service';
import { NotificationChannel, TemplateKey } from './models/notification.model';

const mockPrisma: any = {
  saleOrder: { findUnique: jest.fn() },
  customer: { findMany: jest.fn(), findUnique: jest.fn() },
  supplier: { findUnique: jest.fn() },
  stockLevel: { findFirst: jest.fn() },
  productVariant: { findUnique: jest.fn() },
  branch: { findUnique: jest.fn() },
  warehouse: { findUnique: jest.fn() },
};

const mockSettings = {
  getNotificationSettings: jest.fn<any>().mockResolvedValue({
    notifyOnSale: true,
    notifyOnLowStock: true,
    notifyOnPurchase: true,
    notifyOnTransfer: true,
    notifyOnDelivery: true,
    whatsappEnabled: true,
    lowStockThreshold: 5,
    smtpUser: 'admin@test.com',
  }),
  getGeneralSettings: jest.fn<any>().mockResolvedValue({ companyName: 'Vestix', email: 'admin@test.com' }),
};

const mockNotifications = {
  enqueue: jest.fn<any>().mockResolvedValue({ id: 'job-1' }),
  notifyOrderConfirmed: jest.fn<any>().mockResolvedValue({ id: 'job-2' }),
  notifyLowStock: jest.fn<any>().mockResolvedValue({ id: 'job-3' }),
  notifyShiftDiscrepancy: jest.fn<any>().mockResolvedValue({ id: 'job-4' }),
};

const mockStaffInbox = {
  create: jest.fn<any>().mockResolvedValue({ id: 'inbox-1' }),
};

describe('NotificationTriggersService', () => {
  let service: NotificationTriggersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTriggersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SettingsService, useValue: mockSettings },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: StaffInboxService, useValue: mockStaffInbox },
      ],
    }).compile();

    service = module.get(NotificationTriggersService);
  });

  it('should enqueue manual sale receipt with order data', async () => {
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'order-uuid-1234',
      grandTotal: 15000,
      customer: { fullName: 'Ana García' },
    });

    const result = await service.sendManualSaleReceipt('order-uuid-1234', 'WHATSAPP', '5491122334455');

    expect(result.success).toBe(true);
    expect(mockNotifications.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: NotificationChannel.WHATSAPP,
        templateKey: TemplateKey.MANUAL_SALE_RECEIPT,
        recipient: '5491122334455',
        variables: expect.objectContaining({
          customerName: 'Ana García',
          saleId: 'ORDER',
          total: '15.000,00',
        }),
      }),
    );
  });

  it('should throw when sale order is not found', async () => {
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.sendManualSaleReceipt('missing', 'EMAIL', 'a@test.com'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should throw when enqueue returns null for manual receipt', async () => {
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'order-1',
      grandTotal: 100,
      customer: null,
    });
    mockNotifications.enqueue.mockResolvedValueOnce(null);

    await expect(
      service.sendManualSaleReceipt('order-1', 'EMAIL', 'a@test.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should notify customer on sale completed when notifyOnSale is enabled', async () => {
    mockPrisma.saleOrder.findUnique.mockResolvedValueOnce({
      id: 'sale-abc-def',
      grandTotal: 5000,
      customer: { fullName: 'Juan', email: 'juan@test.com', phone: '5491111222333' },
    });

    await service.onSaleCompleted('sale-abc-def');

    expect(mockNotifications.notifyOrderConfirmed).toHaveBeenCalledTimes(2);
    expect(mockNotifications.notifyOrderConfirmed).toHaveBeenCalledWith(
      'juan@test.com',
      NotificationChannel.EMAIL,
      expect.objectContaining({ customerName: 'Juan' }),
      'sale-abc-def',
    );
  });

  it('should skip sale notifications when notifyOnSale is disabled', async () => {
    mockSettings.getNotificationSettings.mockResolvedValueOnce({ notifyOnSale: false });
    await service.onSaleCompleted('sale-1');
    expect(mockPrisma.saleOrder.findUnique).not.toHaveBeenCalled();
  });

  it('should send low stock alert when stock is at or below threshold', async () => {
    mockPrisma.stockLevel.findFirst.mockResolvedValueOnce({ availableQuantity: 3 });
    mockPrisma.productVariant.findUnique.mockResolvedValueOnce({
      sku: 'SKU-1',
      product: { name: 'Remera' },
    });
    mockPrisma.branch.findUnique.mockResolvedValueOnce({ name: 'Centro' });

    await service.checkLowStock('variant-1', 'warehouse-1', 'branch-1');

    expect(mockNotifications.notifyLowStock).toHaveBeenCalledWith(
      'admin@test.com',
      expect.objectContaining({ productName: 'Remera', quantity: '3' }),
    );
  });

  it('should enqueue order shipped notification when notifyOnDelivery is enabled', async () => {
    await service.onOrderShipped('order-1', {
      customerName: 'María',
      customerPhone: '5491122334455',
      orderRef: 'ORDER',
      courierName: 'Andreani',
      trackingNumber: 'AR123',
      trackingUrl: 'https://tienda.test/track/abc',
    });

    expect(mockNotifications.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: NotificationChannel.WHATSAPP,
        templateKey: TemplateKey.ORDER_SHIPPED,
        recipient: '5491122334455',
        variables: expect.objectContaining({
          trackingUrl: 'https://tienda.test/track/abc',
        }),
      }),
    );
  });

  it('should skip delivery notifications when notifyOnDelivery is disabled', async () => {
    mockSettings.getNotificationSettings.mockResolvedValueOnce({ notifyOnDelivery: false });

    await service.onOrderShipped('order-1', {
      customerName: 'María',
      customerPhone: '5491122334455',
      orderRef: 'ORDER',
      courierName: 'Propio',
      trackingNumber: 'X1',
      trackingUrl: 'https://tienda.test/track/abc',
    });

    expect(mockNotifications.enqueue).not.toHaveBeenCalled();
  });

  it('should enqueue delivery OTP via WhatsApp', async () => {
    await service.onDeliveryOtp('order-1', {
      customerPhone: '5491122334455',
      orderRef: 'ORDER',
      otpCode: '123456',
    });

    expect(mockNotifications.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        templateKey: TemplateKey.DELIVERY_OTP,
        recipient: '5491122334455',
        variables: { orderId: 'ORDER', otpCode: '123456' },
      }),
    );
  });
});
