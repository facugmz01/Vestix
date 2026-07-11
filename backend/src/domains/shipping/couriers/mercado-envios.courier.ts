import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SettingsService } from '../../../modules/settings/settings.service';
import { CarrierAdapter, CarrierType, ShipmentRequest, ShipmentResult } from './courier.interface';

@Injectable()
export class MercadoEnviosCourierAdapter implements CarrierAdapter {
  private readonly logger = new Logger(MercadoEnviosCourierAdapter.name);
  readonly type: CarrierType = 'MERCADO_ENVIOS';

  constructor(private readonly settingsService: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const settings = await this.settingsService.getStorefrontSettings();
    const cfg = settings.deliverySettings?.carriers?.mercadoEnvios;
    return !!(cfg?.enabled && cfg.accessToken);
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    if (request.manualTrackingNumber) {
      return {
        carrierType: 'MERCADO_ENVIOS',
        trackingNumber: request.manualTrackingNumber,
      };
    }

    const settings = await this.settingsService.getStorefrontSettings();
    const cfg = settings.deliverySettings?.carriers?.mercadoEnvios;

    if (!(await this.isConfigured())) {
      throw new BadRequestException(
        'Mercado Envíos no está configurado. Ingresá un número de seguimiento manual o configurá el access token.',
      );
    }

    const response = await fetch('https://api.mercadolibre.com/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg!.accessToken}`,
      },
      body: JSON.stringify({
        external_reference: request.orderId,
        receiver_address: {
          zip_code: request.zipCode,
          street_name: request.address,
          city_name: request.city,
          state_name: request.state,
        },
        receiver_name: request.recipientName,
        receiver_phone: request.recipientPhone,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`MercadoEnvíos API ${response.status}: ${text}`);
      throw new BadRequestException(`MercadoEnvíos API error (${response.status})`);
    }

    const data = await response.json();
    const trackingNumber = data?.tracking_number || data?.id?.toString();
    if (!trackingNumber) {
      throw new BadRequestException('MercadoEnvíos API did not return a tracking number');
    }

    return {
      carrierType: 'MERCADO_ENVIOS',
      trackingNumber,
      carrierShipmentId: data?.id?.toString(),
      labelUrl: data?.label_url,
      externalUrl: data?.id ? `https://www.mercadolibre.com.ar/ventas/${data.id}/detalle` : undefined,
    };
  }

  getTrackingUrl(trackingNumber: string): string {
    return `https://www.mercadolibre.com.ar/ventas/nuevo/envios/${trackingNumber}`;
  }
}
