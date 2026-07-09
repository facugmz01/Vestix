import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';

const mockSettingsService = {
  getIntegrationSettings: jest.fn<any>(),
};

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MercadoPagoService({} as any, mockSettingsService as any);
  });

  describe('isMercadoPagoPaymentMethod', () => {
    it('accepts card and wallet payment types', () => {
      expect(MercadoPagoService.isMercadoPagoPaymentMethod('CREDIT_CARD')).toBe(true);
      expect(MercadoPagoService.isMercadoPagoPaymentMethod('DEBIT_CARD')).toBe(true);
      expect(MercadoPagoService.isMercadoPagoPaymentMethod('DIGITAL_WALLET')).toBe(true);
      expect(MercadoPagoService.isMercadoPagoPaymentMethod('CASH')).toBe(false);
    });
  });

  describe('isTestCredentials', () => {
    it('detects TEST- prefixed tokens as sandbox', () => {
      expect(MercadoPagoService.isTestCredentials('TEST-1234567890')).toBe(true);
      expect(MercadoPagoService.isTestCredentials('APP_USR-1234567890')).toBe(false);
    });
  });

  describe('getWebhookUrls', () => {
    it('uses BACKEND_URL with port 3001 default', () => {
      const original = process.env.BACKEND_URL;
      delete process.env.BACKEND_URL;

      const urls = service.getWebhookUrls();
      expect(urls.storefront).toBe('http://localhost:3001/api/storefront/webhooks/mercadopago');
      expect(urls.pos).toBe('http://localhost:3001/api/pos/webhooks/mercadopago');

      process.env.BACKEND_URL = original;
    });
  });

  describe('ensureConfigured', () => {
    it('throws when integration is disabled', async () => {
      mockSettingsService.getIntegrationSettings.mockResolvedValue({
        mercadopagoEnabled: false,
        mpAccessToken: 'TEST-token',
      });

      await expect(service.ensureConfigured()).rejects.toThrow(BadRequestException);
    });

    it('throws when access token is missing', async () => {
      mockSettingsService.getIntegrationSettings.mockResolvedValue({
        mercadopagoEnabled: true,
        mpAccessToken: '',
      });

      await expect(service.ensureConfigured()).rejects.toThrow(BadRequestException);
    });

    it('returns token when integration is ready', async () => {
      mockSettingsService.getIntegrationSettings.mockResolvedValue({
        mercadopagoEnabled: true,
        mpAccessToken: 'TEST-token',
      });

      await expect(service.ensureConfigured()).resolves.toBe('TEST-token');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('skips verification when no secret is configured', async () => {
      mockSettingsService.getIntegrationSettings.mockResolvedValue({});

      const result = await service.verifyWebhookSignature({}, '12345');
      expect(result.valid).toBe(true);
      expect(result.skipped).toBe(true);
    });

    it('validates HMAC signature per Mercado Pago manifest', async () => {
      const secret = 'test-secret';
      const resourceId = '12345';
      const xRequestId = 'req-abc';
      const ts = '1700000000000';
      const manifest = `id:${resourceId};request-id:${xRequestId};ts:${ts};`;
      const crypto = await import('crypto');
      const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

      mockSettingsService.getIntegrationSettings.mockResolvedValue({ mpWebhookSecret: secret });

      const result = await service.verifyWebhookSignature(
        { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': xRequestId },
        resourceId,
      );

      expect(result.valid).toBe(true);
    });
  });

  describe('createPreference', () => {
    it('throws when Mercado Pago is not configured', async () => {
      mockSettingsService.getIntegrationSettings.mockResolvedValue({ mercadopagoEnabled: false });

      await expect(
        service.createPreference({
          externalReference: 'order-1',
          items: [{ id: 'v1', title: 'Producto', quantity: 1, unit_price: 1000 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createPosQrOrder', () => {
    it('throws when Mercado Pago is not configured', async () => {
      mockSettingsService.getIntegrationSettings.mockResolvedValue({ mercadopagoEnabled: false });

      await expect(
        service.createPosQrOrder({
          externalReference: 'POS-QR-123',
          amount: 1500,
          title: 'Cobro POS',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
