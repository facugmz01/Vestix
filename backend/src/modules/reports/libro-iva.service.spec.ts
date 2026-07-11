import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { LibroIvaService } from './libro-iva.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { InvoiceStatus } from '../../domains/invoicing/models/invoice.model';

const mockPrismaService: any = {
  invoice: { findMany: jest.fn() },
  goodsReceipt: { findMany: jest.fn() },
};

const mockSettingsService: any = {
  getPricingSettings: jest.fn(),
};

describe('LibroIvaService', () => {
  let service: LibroIvaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibroIvaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<LibroIvaService>(LibroIvaService);
    jest.clearAllMocks();
    mockSettingsService.getPricingSettings.mockResolvedValue({ vatDefaultPct: 21 });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVentas', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('returns zero totals when no invoices exist', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValueOnce([]);
      const result = await service.getVentas(filter);
      expect(result.totals.documentCount).toBe(0);
      expect(result.totals.totalAmount).toBe(0);
      expect(result.byVatRate).toEqual([]);
    });

    it('aggregates approved invoices by inferred VAT rate', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValueOnce([
        {
          type: 'FA_A',
          status: InvoiceStatus.APPROVED,
          netAmount: 100,
          vatAmount: 21,
          totalAmount: 121,
        },
        {
          type: 'FA_B',
          status: InvoiceStatus.APPROVED,
          netAmount: 200,
          vatAmount: 42,
          totalAmount: 242,
        },
        {
          type: 'NC_B',
          status: InvoiceStatus.APPROVED,
          netAmount: 50,
          vatAmount: 10.5,
          totalAmount: 60.5,
        },
      ]);

      const result = await service.getVentas(filter);
      expect(result.totals.documentCount).toBe(3);
      expect(result.totals.netAmount).toBe(250);
      expect(result.totals.vatAmount).toBe(52.5);
      expect(result.totals.totalAmount).toBe(302.5);
      expect(result.byVatRate).toEqual([
        expect.objectContaining({ ivaId: 5, vatRatePct: 21, documentCount: 3 }),
      ]);
    });

    it('separates zero-rate Factura C rows', async () => {
      mockPrismaService.invoice.findMany.mockResolvedValueOnce([
        {
          type: 'FA_C',
          status: InvoiceStatus.APPROVED,
          netAmount: 500,
          vatAmount: 0,
          totalAmount: 500,
        },
      ]);

      const result = await service.getVentas(filter);
      expect(result.byVatRate).toEqual([
        expect.objectContaining({ ivaId: 3, vatRatePct: 0, netAmount: 500, vatAmount: 0 }),
      ]);
    });
  });

  describe('getCompras', () => {
    const filter = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };

    it('aggregates validated goods receipts using default VAT', async () => {
      mockPrismaService.goodsReceipt.findMany.mockResolvedValueOnce([
        {
          status: 'VALIDATED',
          lines: [
            { receivedQuantity: 10, poLineItem: { unitCost: 12.1 } },
          ],
        },
      ]);

      const result = await service.getCompras(filter);
      expect(result.totals.documentCount).toBe(1);
      expect(result.totals.totalAmount).toBe(121);
      expect(result.totals.netAmount).toBe(100);
      expect(result.totals.vatAmount).toBe(21);
      expect(result.byVatRate[0]).toEqual(
        expect.objectContaining({ ivaId: 5, vatRatePct: 21 }),
      );
    });
  });
});
