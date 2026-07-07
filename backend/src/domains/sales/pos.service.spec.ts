import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { PosService } from './pos.service';
import { CheckoutOrchestrator } from './checkout.orchestrator';
import { PricingService } from '../catalog/pricing.service';
import { RulesEngineService } from '../catalog/rules-engine.service';
import { CashService } from '../finance/cash/cash.service';
import { PrismaService } from '../../core/prisma/prisma.service';

const mockVariant = {
  id: 'variant-1',
  sku: 'SKU-001',
  barcode: '1234567890',
  basePrice: 1000,
  color: 'Rojo',
  size: 'M',
  product: { categoryId: 'cat-1', name: 'Remera Básica' },
};

const mockPrisma: any = {
  productVariant: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  productBarcode: {
    findUnique: jest.fn(),
  },
  cashRegister: {
    findUnique: jest.fn(),
  },
  warehouse: {
    findFirst: jest.fn(),
  },
  cashShift: {
    findFirst: jest.fn(),
  },
  stockLevel: {
    findMany: jest.fn(),
  },
};

const mockCheckoutOrchestrator: any = {
  processCheckout: jest.fn<any>().mockResolvedValue({ id: 'order-1' }),
};

const mockPricingService: any = {
  resolvePrice: jest.fn<any>(async (_id: string, base: number) => base),
};

const mockRulesEngine: any = {
  evaluateCartPromotions: jest.fn<any>().mockResolvedValue({
    originalTotal: 1000,
    discountTotal: 0,
    finalTotal: 1000,
    appliedPromotions: [],
  }),
};

const mockCashService: any = {
  getActiveShift: jest.fn(),
  openShift: jest.fn(),
  closeShift: jest.fn(),
};

const mockMercadoPagoService: any = {
  createPreference: jest.fn<any>().mockResolvedValue({ preferenceId: 'mock', initPoint: 'http://mock' }),
};

describe('PosService', () => {
  let service: PosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: CheckoutOrchestrator, useValue: mockCheckoutOrchestrator },
        { provide: PricingService, useValue: mockPricingService },
        { provide: RulesEngineService, useValue: mockRulesEngine },
        { provide: CashService, useValue: mockCashService },
        { provide: MercadoPagoService, useValue: mockMercadoPagoService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveBarcode', () => {
    it('resolves variant by primary barcode', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValueOnce(mockVariant);

      const result = await service.resolveBarcode('1234567890');

      expect(result.variantId).toBe('variant-1');
      expect(result.name).toBe('Remera Básica');
    });

    it('resolves variant by secondary ProductBarcode', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValueOnce(null);
      mockPrisma.productBarcode.findUnique.mockResolvedValueOnce({
        barcode: 'ALT-999',
        variant: mockVariant,
      });

      const result = await service.resolveBarcode('ALT-999');

      expect(result.variantId).toBe('variant-1');
    });

    it('throws when barcode is not found', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValueOnce(null);
      mockPrisma.productBarcode.findUnique.mockResolvedValueOnce(null);

      await expect(service.resolveBarcode('UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateCart', () => {
    it('applies cartDiscountPct on top of promotions', async () => {
      mockPrisma.productVariant.findUnique.mockResolvedValue({
        id: 'variant-1',
        basePrice: 1000,
        product: { categoryId: 'cat-1' },
      });

      const result = await service.calculateCart({
        lines: [{ variantId: 'variant-1', quantity: 1 }],
        cartDiscountPct: 10,
      });

      expect(result.grandTotal).toBe(900);
      expect(result.cartDiscountTotal).toBe(100);
    });
  });

  describe('processQuickSale', () => {
    it('auto-resolves open cash shift when cashShiftId is omitted', async () => {
      mockPrisma.cashRegister.findUnique.mockResolvedValue({
        id: 'register-1',
        branchId: 'branch-1',
        branch: { id: 'branch-1' },
      });
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1' });
      mockPrisma.cashShift.findFirst.mockResolvedValue({ id: 'shift-1' });

      await service.processQuickSale({
        cashRegisterId: 'register-1',
        variantId: 'variant-1',
        categoryId: 'cat-1',
        accountId: 'acc-1',
      });

      expect(mockCheckoutOrchestrator.processCheckout).toHaveBeenCalledWith(
        expect.objectContaining({ cashShiftId: 'shift-1' }),
        undefined,
      );
    });

    it('throws when no open shift exists', async () => {
      mockPrisma.cashRegister.findUnique.mockResolvedValue({
        id: 'register-1',
        branchId: 'branch-1',
        branch: { id: 'branch-1' },
      });
      mockPrisma.warehouse.findFirst.mockResolvedValue({ id: 'wh-1' });
      mockPrisma.cashShift.findFirst.mockResolvedValue(null);

      await expect(
        service.processQuickSale({
          cashRegisterId: 'register-1',
          variantId: 'variant-1',
          categoryId: 'cat-1',
          accountId: 'acc-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('QR orders', () => {
    it('creates and polls a pending QR order', () => {
      const { orderId } = service.createQrOrder(1500, 'Cobro POS');
      const status = service.getQrOrderStatus(orderId);
      expect(status.status).toBe('PENDING');
      expect(status.amount).toBe(1500);
    });

    it('confirms a QR order manually', () => {
      const { orderId } = service.createQrOrder(500, 'Test');
      service.confirmQrOrder(orderId);
      const status = service.getQrOrderStatus(orderId);
      expect(status.status).toBe('APPROVED');
    });
  });

  describe('getCatalogSyncData', () => {
    const mockCatalogVariant = {
      id: 'variant-1',
      productId: 'prod-1',
      sku: 'SKU-001',
      barcode: '1234567890',
      basePrice: 1000,
      size: 'M',
      color: 'Rojo',
      imageUrl: null,
      updatedAt: new Date('2026-07-01T12:00:00Z'),
      product: {
        name: 'Remera Básica',
        categoryId: 'cat-1',
        category: { name: 'Remeras' },
        brand: { name: 'Vestix' },
        images: ['https://example.com/img.jpg'],
      },
      barcodes: [{ barcode: 'ALT-001' }],
    };

    it('returns full catalog with stock when no since param', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValueOnce([mockCatalogVariant]);
      mockPrisma.stockLevel.findMany.mockResolvedValueOnce([
        { variantId: 'variant-1', availableQuantity: 5 },
      ]);

      const result = await service.getCatalogSyncData(undefined, 'branch-1');

      expect(result.incremental).toBe(false);
      expect(result.removedIds).toEqual([]);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'variant-1',
        sku: 'SKU-001',
        stock: 5,
        categoryName: 'Remeras',
        brandName: 'Vestix',
      });
      expect(mockPrisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
      expect(mockPrisma.stockLevel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { variantId: { in: ['variant-1'] }, branchId: 'branch-1' } }),
      );
    });

    it('returns incremental updates and removed variant ids', async () => {
      mockPrisma.productVariant.findMany
        .mockResolvedValueOnce([mockCatalogVariant])
        .mockResolvedValueOnce([{ id: 'variant-old' }]);
      mockPrisma.stockLevel.findMany.mockResolvedValueOnce([]);

      const since = '2026-07-01T00:00:00Z';
      const result = await service.getCatalogSyncData(since);

      expect(result.incremental).toBe(true);
      expect(result.removedIds).toEqual(['variant-old']);
      expect(mockPrisma.productVariant.findMany).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { isActive: true, updatedAt: { gt: new Date(since) } },
        }),
      );
      expect(mockPrisma.productVariant.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: { isActive: false, updatedAt: { gt: new Date(since) } },
        }),
      );
    });
  });

  describe('session management', () => {
    it('delegates openSession to CashService', async () => {
      mockCashService.openShift.mockResolvedValue({ id: 'shift-1' });

      await service.openSession({
        cashRegisterId: 'register-1',
        openingAmount: 100,
        userId: 'user-1',
      });

      expect(mockCashService.openShift).toHaveBeenCalledWith('register-1', 'user-1', 100);
    });
  });
});
