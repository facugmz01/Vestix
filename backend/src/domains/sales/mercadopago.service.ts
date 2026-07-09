import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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
  mpOrderId: string;
  qrData: string;
}

export interface MercadoPagoWebhookUrls {
  storefront: string;
  pos: string;
}

export type MercadoPagoEnvironment = 'test' | 'production';

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

  /** @deprecated Use resolveEnvironment — TEST- prefix only; modern test creds use APP_USR- */
  static isTestCredentials(accessToken: string): boolean {
    return accessToken.startsWith('TEST-');
  }

  static inferEnvironmentFromCredentials(
    accessToken?: string,
    publicKey?: string,
  ): MercadoPagoEnvironment | null {
    if (accessToken?.startsWith('TEST-') || publicKey?.startsWith('TEST-')) {
      return 'test';
    }
    return null;
  }

  static resolveEnvironment(
    mpEnvironment: MercadoPagoEnvironment | undefined,
    accessToken?: string,
    publicKey?: string,
  ): MercadoPagoEnvironment {
    if (mpEnvironment === 'test' || mpEnvironment === 'production') {
      return mpEnvironment;
    }
    return MercadoPagoService.inferEnvironmentFromCredentials(accessToken, publicKey) ?? 'production';
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
    const dbToken = intSettings.mpAccessToken?.trim();
    if (dbToken) {
      return dbToken;
    }

    const envToken = process.env.MP_ACCESS_TOKEN?.trim();
    if (envToken) {
      this.logger.warn(
        '[MercadoPago] Using MP_ACCESS_TOKEN from environment. Guardá las credenciales en Admin → Integraciones para evitar que el .env pise la configuración.',
      );
      return envToken;
    }

    return '';
  }

  async getWebhookSecret(): Promise<string> {
    const intSettings = await this.settingsService.getIntegrationSettings();
    return intSettings.mpWebhookSecret || process.env.MP_WEBHOOK_SECRET || '';
  }

  async isIntegrationEnabled(): Promise<boolean> {
    const intSettings = await this.settingsService.getIntegrationSettings();
    return intSettings.mercadopagoEnabled ?? false;
  }

  /**
   * Ensures Mercado Pago is enabled and has credentials (TEST- or production).
   * Throws BadRequestException when not ready — never falls back to mock behavior.
   */
  async ensureConfigured(): Promise<string> {
    const enabled = await this.isIntegrationEnabled();
    if (!enabled) {
      throw new BadRequestException(
        'Mercado Pago no está habilitado. Activá la integración en Admin → Integraciones.',
      );
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new BadRequestException(
        'Mercado Pago no tiene credenciales configuradas. Ingresá Public Key y Access Token (TEST- o APP_USR-) en Admin → Integraciones.',
      );
    }

    return accessToken;
  }

  async getCredentialMode(accessToken?: string): Promise<MercadoPagoEnvironment> {
    const intSettings = await this.settingsService.getIntegrationSettings();
    const token = accessToken ?? intSettings.mpAccessToken ?? '';
    return MercadoPagoService.resolveEnvironment(
      intSettings.mpEnvironment,
      token,
      intSettings.mpPublicKey,
    );
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
    try {
      const accessToken = await this.ensureConfigured();
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
      const mode = (await this.getCredentialMode(accessToken)) === 'test' ? 'pruebas' : 'producción';
      const nickname = profile.nickname || profile.email || profile.id;
      return {
        success: true,
        message: `Conexión exitosa (${mode}) — cuenta: ${nickname}`,
      };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) {
        return { success: false, message: err.message };
      }
      const message = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, message: `Fallo de conexión: ${message}` };
    }
  }

  async fetchPayment(paymentId: string | number): Promise<MercadoPagoPayment | null> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      this.logger.error('[MercadoPago] Cannot fetch payment: no access token configured');
      return null;
    }

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
    if (!accessToken) {
      this.logger.error('[MercadoPago] Cannot fetch order: no access token configured');
      return null;
    }

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
    const accessToken = await this.ensureConfigured();
    const storeUrl = (dto.backUrls?.success || process.env.MP_STORE_URL || 'http://localhost:3000/store')
      .replace(/\/checkout\/success.*$/, '');

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
      const mode = await this.getCredentialMode(accessToken);

      // MP deprecated sandbox_init_point; init_point respects test vs prod credentials.
      const initPoint = preference.init_point || preference.sandbox_init_point;
      if (!initPoint) {
        throw new Error('MercadoPago preference response missing init_point');
      }

      this.logger.log(`[MercadoPago] ✓ Preference created: ${preference.id} (${mode})`);

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
   */
  async createPosQrOrder(dto: CreatePosQrOrderDto): Promise<PosQrOrderResult> {
    const accessToken = await this.ensureConfigured();
    const mode = dto.mode || (dto.externalPosId ? 'hybrid' : 'dynamic');
    const amountStr = dto.amount.toFixed(2);

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
      return { orderId: dto.externalReference, mpOrderId: orderId, qrData };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`[MercadoPago] Failed to create POS QR order: ${message}`);
      throw new InternalServerErrorException(`No se pudo generar el QR de Mercado Pago: ${message}`);
    }
  }
}
