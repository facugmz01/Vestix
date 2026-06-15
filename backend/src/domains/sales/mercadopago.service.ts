import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface MercadoPagoPreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
}

export interface CreatePreferenceDto {
  externalReference: string;   // Our internal order ID
  items: MercadoPagoPreferenceItem[];
  payer?: {
    name?: string;
    email?: string;
    phone?: { area_code?: string; number?: string };
  };
  shippingCost?: number;        // Additional shipping cost
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
}

export interface MercadoPagoPreference {
  id: string;
  init_point: string;          // URL to redirect user to for payment
  sandbox_init_point: string;  // URL for testing
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getAccessToken(): Promise<string> {
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    const intSettings = (settings?.integrations as any) || {};
    return intSettings.mpAccessToken || process.env.MP_ACCESS_TOKEN || '';
  }

  /**
   * Creates a payment preference on Mercado Pago.
   * Returns the URL the user should be redirected to.
   */
  async createPreference(dto: CreatePreferenceDto): Promise<{ initPoint: string; preferenceId: string }> {
    const accessToken = await this.getAccessToken();
    const isMock = !accessToken || accessToken === '';
    const storeUrl = process.env.MP_STORE_URL || 'http://localhost:5173/store';

    if (isMock) {
      // Mock mode: log and return a simulated URL
      this.logger.log(
        `[MercadoPago Mock] Preference requested:\n` +
        `  Reference: ${dto.externalReference}\n` +
        `  Items: ${dto.items.map(i => `${i.title} x${i.quantity}`).join(', ')}\n` +
        `  Total: $${dto.items.reduce((s, i) => s + i.unit_price * i.quantity, 0) + (dto.shippingCost || 0)}`
      );

      return {
        preferenceId: `MOCK-${dto.externalReference}`,
        initPoint: `${storeUrl}/checkout-success?orderId=${dto.externalReference}&mock=true`,
      };
    }

    const payload: any = {
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
      notification_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/storefront/webhooks/mercadopago`,
    };

    // Include payer info if available
    if (dto.payer) {
      payload.payer = dto.payer;
    }

    // Add shipping as an additional item if cost > 0
    if (dto.shippingCost && dto.shippingCost > 0) {
      payload.items.push({
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
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`MercadoPago API error ${response.status}: ${error}`);
      }

      const preference: MercadoPagoPreference = await response.json();

      this.logger.log(`[MercadoPago] ✓ Preference created: ${preference.id}`);

      const initPoint = process.env.NODE_ENV === 'production'
        ? preference.init_point
        : preference.sandbox_init_point;

      return {
        preferenceId: preference.id,
        initPoint,
      };
    } catch (err: any) {
      this.logger.error(`[MercadoPago] Failed to create preference: ${err.message}`);
      throw new InternalServerErrorException(`No se pudo crear la preferencia de pago: ${err.message}`);
    }
  }
}
