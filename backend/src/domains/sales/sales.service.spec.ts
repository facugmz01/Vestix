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

  const mockAfipProducer: any = {
    enqueueInvoiceGeneration: jest.fn(),
  };

  let service: SalesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SalesService(
      mockPrisma,
      mockRepository,
      mockCatalogFacade,
      mockSettingsService,
      {
        chargeCustomerSaleInTx: jest.fn(),
        reverseCustomerSaleInTx: jest.fn(),
      } as any,
      mockAfipProducer,
    );
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

  describe('computeInvoicingStatus', () => {
    it('returns INVOICED when approved invoice with CAE exists', () => {
      const status = service.computeInvoicingStatus({
        invoices: [{ status: 'APPROVED', cae: '12345678901234' }],
      });
      expect(status).toBe('INVOICED');
    });

    it('returns PENDING when invoice is in PENDING_AFIP status', () => {
      const status = service.computeInvoicingStatus({
        invoices: [{ status: 'PENDING_AFIP' }],
      });
      expect(status).toBe('PENDING');
    });

    it('returns FAILED when invoice has failed/rejected status', () => {
      const status = service.computeInvoicingStatus({
        invoices: [{ status: 'FAILED', afipErrorMessage: 'CUIT inválido' }],
      });
      expect(status).toBe('FAILED');
    });

    it('returns NOT_REQUESTED when no invoices exist and issueInvoice is false', () => {
      const status = service.computeInvoicingStatus({
        issueInvoice: false,
        invoices: [],
      });
      expect(status).toBe('NOT_REQUESTED');
    });
  });

  describe('emitOrderInvoice', () => {
    it('enqueues invoice generation and creates draft invoice for un-invoiced sale', async () => {
      const mockOrder = {
        id: 'order-123',
        branchId: 'branch-1',
        status: 'COMPLETED',
        grandTotal: 12100,
        customerId: 'cust-1',
        customer: { id: 'cust-1', taxId: '20123456789', taxCondition: 'CONSUMIDOR_FINAL' },
        invoices: [],
        lines: [],
      };

      (mockPrisma as any).saleOrder = {
        findUnique: (jest.fn() as any).mockResolvedValue(mockOrder),
        update: (jest.fn() as any).mockResolvedValue({ ...mockOrder, issueInvoice: true }),
      };
      (mockPrisma as any).invoice = {
        create: (jest.fn() as any).mockResolvedValue({
          id: 'inv-1',
          orderId: 'order-123',
          type: 'FACTURA_B',
          status: 'PENDING_AFIP',
        }),
      };

      const result = await service.emitOrderInvoice('order-123', {
        invoiceType: 'FACTURA_B',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('PENDING_AFIP');
      expect(mockAfipProducer.enqueueInvoiceGeneration).toHaveBeenCalledWith('order-123', 'branch-1');
    });

    it('rejects invoice emission for cancelled order', async () => {
      (mockPrisma as any).saleOrder = {
        findUnique: (jest.fn() as any).mockResolvedValue({
          id: 'order-cancelled',
          status: 'CANCELLED',
          invoices: [],
        }),
      };

      await expect(service.emitOrderInvoice('order-cancelled')).rejects.toThrow(
        'No se puede emitir factura para una venta cancelada',
      );
    });

    it('rejects invoice emission if order already has an approved CAE invoice', async () => {
      (mockPrisma as any).saleOrder = {
        findUnique: (jest.fn() as any).mockResolvedValue({
          id: 'order-already-invoiced',
          status: 'COMPLETED',
          invoices: [{ status: 'APPROVED', cae: '74839201928374', receiptNumber: '0001-00000042' }],
        }),
      };

      await expect(service.emitOrderInvoice('order-already-invoiced')).rejects.toThrow(
        'Esta orden ya posee una factura emitida con CAE',
      );
    });
  });
});
