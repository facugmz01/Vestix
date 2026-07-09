import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SettingsService } from '../../modules/settings/settings.service';

export interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface CreatePreferenceDto {
  externalReference: string;
  items: MercadoPagoPreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
    phone?: { area_code?: string; number?: string };
  };
  shippingCost?: number;
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
}

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  skipped?: boolean;
  error?: string;
}

export interface MercadoPagoPayment {
  id: number;
  status: string;
  external_reference?: string;
}

export interface CreatePosQrOrderDto {
  externalReference: string;
  amount: number;
  title: string;
  externalPosId?: string;
  mode?: 'dynamic' | 'hybrid';
}

export interface PosQrOrderResult {
  orderId: string;
  mpOrderId?: string;
  qrData: string;
  isMock: boolean;
}

export interface MercadoPagoWebhookUrls {
  storefront: string;
  pos: string;
}

const MP_PAYMENT_METHOD_TYPES = new Set(['CREDIT_CARD', 'DEBIT_CARD', 'DIGITAL_WALLET']);

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  static isMercadoPagoPaymentMethod(paymentMethodType: string): boolean {
    return MP_PAYMENT_METHOD_TYPES.has(paymentMethodType);
  }

  static isTestCredentials(accessToken: string): boolean {
    return accessToken.startsWith('TEST-');
  }

  getBackendBaseUrl(): string {
    return process.env.BACKEND_URL || 'http://localhost:3001';
  }

  getWebhookUrls(): MercadoPagoWebhookUrls {
    const base = this.getBackendBaseUrl();
    return {
      storefront: `${base}/api/storefront/webhooks/mercadopago`,
      pos: `${base}/api/pos/webhooks/mercadopago`,
    };
  }

  async getAccessToken(): Promise<string> {
    const intSettings = await this.settingsService.getIntegrationSettings();
    return intSettings.mpAccessToken || process.env.MP_ACCESS_TOKEN || '';
  }

  async getWebhookSecret(): Promise<string> {
    const intSettings = await this.settingsService.getIntegrationSettings();
    return intSettings.mpWebhookSecret || process.env.MP_WEBHOOK_SECRET || '';
  }

  async isIntegrationEnabled(): Promise<boolean> {
    const intSettings = await this.settingsService.getIntegrationSettings();
    return intSettings.mercadopagoEnabled ?? false;
  }

  async verifyWebhookSignature(
    headers: Record<string, string | string[] | undefined>,
    resourceId: string | number,
    webhookSecret?: string,
  ): Promise<WebhookVerificationResult> {
    const secret = webhookSecret ?? await this.getWebhookSecret();

    if (!secret) {
      this.logger.warn('[MercadoPago] No webhook secret configured, skipping signature verification');
      return { valid: true, skipped: true };
    }

    const xSignature = headers['x-signature'] as string | undefined;
    const xRequestId = headers['x-request-id'] as string | undefined;

    if (!xSignature || !xRequestId) {
      return { valid: false, error: 'Signature headers missing' };
    }

    try {
      const parts = xSignature.split(',');
      const tsPart = parts.find(p => p.trim().startsWith('ts='));
      const v1Part = parts.find(p => p.trim().startsWith('v1='));

      if (!tsPart || !v1Part) {
        return { valid: false, error: 'Invalid signature format' };
      }

      const ts = tsPart.split('=')[1];
      const v1 = v1Part.split('=')[1];
      const dataId = resourceId.toString().toLowerCase();
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const calculatedHash = createHmac('sha256', secret).update(manifest).digest('hex');

      if (calculatedHash !== v1) {
        return { valid: false, error: 'Signature mismatch' };
      }

      return { valid: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { valid: false, error: `Signature verification error: ${message}` };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return { success: false, message: 'No hay Access Token configurado' };
    }

    try {
      const response = await fetch('https://api.mercadopago.com/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          message: `Credenciales inválidas (${response.status}): ${error.slice(0, 200)}`,
        };
      }

      const profile = await response.json();
      const mode = MercadoPagoService.isTestCredentials(accessToken) ? 'sandbox (TEST)' : 'producción';
      const nickname = profile.nickname || profile.email || profile.id;
      return {
        success: true,
        message: `Conexión exitosa (${mode}) — cuenta: ${nickname}`,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Fallo de conexión: ${message}` };
    }
  }

  async fetchPayment(paymentId: string | number): Promise<MercadoPagoPayment | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.logger.error(`[MercadoPago] Failed to fetch payment ${paymentId}: ${response.status}`);
      return null;
    }

    return response.json();
  }

  async fetchOrder(orderId: string): Promise<Record<string, unknown> | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) return null;

    const response = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      this.logger.error(`[MercadoPago] Failed to fetch order ${orderId}: ${response.status}`);
      return null;
    }

    return response.json();
  }

  /**
   * Creates a payment preference on Mercado Pago (Checkout Pro).
   */
  async createPreference(dto: CreatePreferenceDto): Promise<{ initPoint: string; preferenceId: string }> {
    const accessToken = await this.getAccessToken();
    const isMock = !accessToken;
    const storeUrl = (dto.backUrls?.success || process.env.MP_STORE_URL || 'http://localhost:3000/store')
      .replace(/\/checkout\/success.*$/, '');

    if (isMock) {
      this.logger.log(
        `[MercadoPago Mock] Preference requested:\n` +
        `  Reference: ${dto.externalReference}\n` +
        `  Items: ${dto.items.map(i => `${i.title} x${i.quantity}`).join(', ')}\n` +
        `  Total: $${dto.items.reduce((s, i) => s + i.unit_price * i.quantity, 0) + (dto.shippingCost || 0)}`,
      );

      return {
        preferenceId: `MOCK-${dto.externalReference}`,
        initPoint: `${storeUrl}/checkout/success?orderId=${dto.externalReference}&mock=true`,
      };
    }

    const webhookUrls = this.getWebhookUrls();
    const payload: Record<string, unknown> = {
      external_reference: dto.externalReference,
      items: dto.items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || 'ARS',
      })),
      back_urls: {
        success: dto.backUrls?.success || `${storeUrl}/checkout/success`,
        failure: dto.backUrls?.failure || `${storeUrl}/checkout/failure`,
        pending: dto.backUrls?.pending || `${storeUrl}/checkout/pending`,
      },
      auto_return: 'approved',
      notification_url: webhookUrls.storefront,
    };

    if (dto.payer) {
      payload.payer = dto.payer;
    }

    if (dto.shippingCost && dto.shippingCost > 0) {
      (payload.items as unknown[]).push({
        id: 'SHIPPING',
        title: 'Costo de envío',
        quantity: 1,
        unit_price: dto.shippingCost,
        currency_id: 'ARS',
      });
    }

    try {
      const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MercadoPago API error ${response.status}: ${error}`);
      }

      const preference: MercadoPagoPreference = await response.json();
      this.logger.log(`[MercadoPago] ✓ Preference created: ${preference.id}`);

      const initPoint = MercadoPagoService.isTestCredentials(accessToken)
        ? preference.sandbox_init_point
        : preference.init_point;

      return {
        preferenceId: preference.id,
        initPoint,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`[MercadoPago] Failed to create preference: ${message}`);
      throw new InternalServerErrorException(`No se pudo crear la preferencia de pago: ${message}`);
    }
  }

  /**
   * Creates a dynamic QR order for POS using the unified Orders API.
   * Falls back to mock QR data when credentials are missing.
   */
  async createPosQrOrder(dto: CreatePosQrOrderDto): Promise<PosQrOrderResult> {
    const accessToken = await this.getAccessToken();
    const mode = dto.mode || (dto.externalPosId ? 'hybrid' : 'dynamic');
    const amountStr = dto.amount.toFixed(2);

    if (!accessToken) {
      const mockQrData = `00020101021243650016COM.MERCADOPAGO...${dto.externalReference}-AMT${dto.amount}`;
      this.logger.log(`[MercadoPago Mock] POS QR order: ${dto.externalReference} — $${amountStr}`);
      return {
        orderId: dto.externalReference,
        qrData: mockQrData,
        isMock: true,
      };
    }

    const payload: Record<string, unknown> = {
      type: 'qr',
      external_reference: dto.externalReference,
      description: dto.title.slice(0, 150),
      total_amount: amountStr,
      expiration_time: 'PT15M',
      config: {
        qr: {
          mode,
          ...(dto.externalPosId ? { external_pos_id: dto.externalPosId } : {}),
        },
      },
      transactions: {
        payments: [{ amount: amountStr }],
      },
      items: [
        {
          title: dto.title.slice(0, 150),
          unit_price: amountStr,
          quantity: 1,
          unit_measure: 'unit',
        },
      ],
    };

    try {
      const response = await fetch('https://api.mercadopago.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'X-Idempotency-Key': dto.externalReference,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MercadoPago Orders API error ${response.status}: ${error}`);
      }

      const order = await response.json();
      const qrData = order?.type_response?.qr_data as string | undefined;
      const orderId = order?.id as string | undefined;

      if (!qrData || !orderId) {
        throw new Error('Respuesta de Mercado Pago sin qr_data o id de order');
      }

      this.logger.log(`[MercadoPago] ✓ POS QR order created: ${orderId}`);
      return { orderId: dto.externalReference, mpOrderId: orderId, qrData, isMock: false };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`[MercadoPago] Failed to create POS QR order: ${message}`);
      throw new InternalServerErrorException(`No se pudo generar el QR de Mercado Pago: ${message}`);
    }
  }
}
