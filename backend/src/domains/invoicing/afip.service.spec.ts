import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AfipService } from './afip.service';
import { SettingsService } from '../../modules/settings/settings.service';

const mockGetLastVoucher = jest.fn<any>().mockResolvedValue(5);
const mockCreateVoucher = jest.fn<any>().mockResolvedValue({
  CAE: '71012345678901',
  CAEFchVto: '2026-07-20',
});

jest.mock('@afipsdk/afip.js', () => {
  return jest.fn().mockImplementation(() => ({
    ElectronicBilling: {
      getLastVoucher: mockGetLastVoucher,
      createVoucher: mockCreateVoucher,
    },
  }));
});

const mockSettingsService: any = {
  getArcaSettings: jest.fn(),
};

describe('AfipService', () => {
  let service: AfipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AfipService,
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<AfipService>(AfipService);
    jest.clearAllMocks();
    mockGetLastVoucher.mockResolvedValue(5);
    mockCreateVoucher.mockResolvedValue({
      CAE: '71012345678901',
      CAEFchVto: '2026-07-20',
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isConfigured', () => {
    it('should return false when ARCA is disabled', async () => {
      mockSettingsService.getArcaSettings.mockResolvedValueOnce({
        enabled: false,
        cuit: '20123456789',
        certAlias: 'test',
      });

      await expect(service.isConfigured()).resolves.toBe(false);
    });
  });

  describe('createElectronicInvoice', () => {
    const configuredArca = {
      enabled: true,
      cuit: '20123456789',
      certAlias: 'testalias',
      environment: 'homologation',
      pointOfSale: 1,
    };

    it('should throw ServiceUnavailableException when AFIP is not configured', async () => {
      mockSettingsService.getArcaSettings.mockResolvedValueOnce({
        enabled: false,
        cuit: '',
        certAlias: '',
      });

      await expect(
        service.createElectronicInvoice({
          pointOfSale: 1,
          invoiceType: 6,
          documentType: 96,
          documentNumber: 12345678,
          netAmount: 100,
          vatAmount: 21,
          totalAmount: 121,
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('should call AFIP SDK and return CAE response', async () => {
      mockSettingsService.getArcaSettings.mockResolvedValue({
        ...configuredArca,
      });

      jest.spyOn(require('./afip-config.util'), 'evaluateAfipConfiguration').mockReturnValue({
        configured: true,
        enabled: true,
        hasCuit: true,
        hasCertificates: true,
        missing: [],
      });
      jest.spyOn(require('./afip-config.util'), 'resolveAfipCertificates').mockReturnValue({
        cert: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
        key: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
      });

      const result = await service.createElectronicInvoice({
        pointOfSale: 1,
        invoiceType: 6,
        documentType: 96,
        documentNumber: 12345678,
        netAmount: 100,
        vatAmount: 21,
        totalAmount: 121,
      });

      expect(mockGetLastVoucher).toHaveBeenCalledWith(1, 6);
      expect(mockCreateVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          PtoVta: 1,
          CbteTipo: 6,
          CbteDesde: 6,
          CbteHasta: 6,
          ImpNeto: 100,
          ImpIVA: 21,
          ImpTotal: 121,
          Iva: [{ Id: 5, BaseImp: 100, Importe: 21 }],
        }),
      );
      expect(result).toEqual({
        cae: '71012345678901',
        caeExpiration: '2026-07-20',
        receiptNumber: '00001-00000006',
      });
    });

    it('should send multiple IVA alícuotas when vatBreakdown is provided', async () => {
      mockSettingsService.getArcaSettings.mockResolvedValue({
        ...configuredArca,
      });

      jest.spyOn(require('./afip-config.util'), 'evaluateAfipConfiguration').mockReturnValue({
        configured: true,
        enabled: true,
        hasCuit: true,
        hasCertificates: true,
        missing: [],
      });
      jest.spyOn(require('./afip-config.util'), 'resolveAfipCertificates').mockReturnValue({
        cert: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
        key: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
      });

      await service.createElectronicInvoice({
        pointOfSale: 1,
        invoiceType: 1,
        documentType: 80,
        documentNumber: 30123456789,
        netAmount: 200,
        vatAmount: 31.5,
        totalAmount: 231.5,
        vatBreakdown: [
          { ivaId: 5, vatRate: 0.21, netAmount: 100, vatAmount: 21 },
          { ivaId: 4, vatRate: 0.105, netAmount: 100, vatAmount: 10.5 },
        ],
      });

      expect(mockCreateVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          ImpNeto: 200,
          ImpIVA: 31.5,
          ImpTotal: 231.5,
          Iva: [
            { Id: 5, BaseImp: 100, Importe: 21 },
            { Id: 4, BaseImp: 100, Importe: 10.5 },
          ],
        }),
      );
    });

    it('should omit IVA array for Factura C (no discrimination)', async () => {
      mockSettingsService.getArcaSettings.mockResolvedValue({
        ...configuredArca,
      });

      jest.spyOn(require('./afip-config.util'), 'evaluateAfipConfiguration').mockReturnValue({
        configured: true,
        enabled: true,
        hasCuit: true,
        hasCertificates: true,
        missing: [],
      });
      jest.spyOn(require('./afip-config.util'), 'resolveAfipCertificates').mockReturnValue({
        cert: '-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----',
        key: '-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----',
      });

      await service.createElectronicInvoice({
        pointOfSale: 1,
        invoiceType: 11,
        documentType: 80,
        documentNumber: 30123456789,
        netAmount: 500,
        vatAmount: 0,
        totalAmount: 500,
        noIvaDiscrimination: true,
      });

      const payload = mockCreateVoucher.mock.calls[0][0] as {
        ImpNeto: number;
        ImpIVA: number;
        Iva?: unknown;
      };
      expect(payload.ImpNeto).toBe(500);
      expect(payload.ImpIVA).toBe(0);
      expect(payload.Iva).toBeUndefined();
    });
  });

  describe('buildIvaArray', () => {
    it('builds AFIP IVA lines from breakdown', () => {
      const lines = service.buildIvaArray([
        { ivaId: 5, vatRate: 0.21, netAmount: 100, vatAmount: 21 },
        { ivaId: 4, vatRate: 0.105, netAmount: 100, vatAmount: 10.5 },
      ]);
      expect(lines).toEqual([
        { Id: 5, BaseImp: 100, Importe: 21 },
        { Id: 4, BaseImp: 100, Importe: 10.5 },
      ]);
    });
  });
});
