import { Injectable, Logger } from '@nestjs/common';
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
    const settings = await this.settingsService.getStorefrontSettings();
    const cfg = settings.deliverySettings?.carriers?.mercadoEnvios;

    if (!(await this.isConfigured())) {
      return {
        carrierType: 'MERCADO_ENVIOS',
        trackingNumber: request.manualTrackingNumber || `ME-${request.orderRef}`,
      };
    }

    try {
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
        throw new Error(`MercadoEnvíos API ${response.status}`);
      }

      const data = await response.json();
      const trackingNumber = data?.tracking_number || data?.id?.toString() || request.manualTrackingNumber;

      return {
        carrierType: 'MERCADO_ENVIOS',
        trackingNumber: trackingNumber || `ME-${request.orderRef}`,
        carrierShipmentId: data?.id?.toString(),
        labelUrl: data?.label_url,
        externalUrl: data?.id ? `https://www.mercadolibre.com.ar/ventas/${data.id}/detalle` : undefined,
      };
    } catch (err: any) {
      this.logger.warn(`MercadoEnvíos shipment fallback for ${request.orderId}: ${err.message}`);
      return {
        carrierType: 'MERCADO_ENVIOS',
        trackingNumber: request.manualTrackingNumber || `ME-${request.orderRef}`,
      };
    }
  }

  getTrackingUrl(trackingNumber: string): string {
    return `https://www.mercadolibre.com.ar/ventas/nuevo/envios/${trackingNumber}`;
  }
}
