import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../../../modules/settings/settings.service';
import { CarrierAdapter, CarrierType, ShipmentRequest, ShipmentResult } from './courier.interface';

@Injectable()
export class AndreaniCourierAdapter implements CarrierAdapter {
  private readonly logger = new Logger(AndreaniCourierAdapter.name);
  readonly type: CarrierType = 'ANDREANI';

  constructor(private readonly settingsService: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const settings = await this.settingsService.getStorefrontSettings();
    const cfg = settings.deliverySettings?.carriers?.andreani;
    return !!(cfg?.enabled && cfg.apiKey && cfg.clientId);
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    const settings = await this.settingsService.getStorefrontSettings();
    const cfg = settings.deliverySettings?.carriers?.andreani;

    if (!(await this.isConfigured())) {
      return {
        carrierType: 'ANDREANI',
        trackingNumber: request.manualTrackingNumber || `AND-${request.orderRef}`,
      };
    }

    try {
      const response = await fetch('https://apis.andreani.com/v2/ordenes-de-envio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cfg!.apiKey}`,
          'x-client-id': cfg!.clientId!,
        },
        body: JSON.stringify({
          contrato: cfg!.contract,
          destino: {
            postal: {
              codigoPostal: request.zipCode,
              calle: request.address,
              localidad: request.city,
              provincia: request.state,
            },
          },
          destinatario: [{ nombreCompleto: request.recipientName, telefono: request.recipientPhone }],
          referencias: [request.orderId],
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Andreani API ${response.status}`);
      }

      const data = await response.json();
      const trackingNumber = data?.numeroDeEnvio || data?.trackingNumber || request.manualTrackingNumber;

      return {
        carrierType: 'ANDREANI',
        trackingNumber: trackingNumber || `AND-${request.orderRef}`,
        carrierShipmentId: data?.id?.toString(),
        labelUrl: data?.etiquetaUrl,
        externalUrl: trackingNumber ? `https://www.andreani.com/#!/informacionEnvio/${trackingNumber}` : undefined,
      };
    } catch (err: any) {
      this.logger.warn(`Andreani shipment fallback for ${request.orderId}: ${err.message}`);
      return {
        carrierType: 'ANDREANI',
        trackingNumber: request.manualTrackingNumber || `AND-${request.orderRef}`,
      };
    }
  }

  getTrackingUrl(trackingNumber: string): string {
    return `https://www.andreani.com/#!/informacionEnvio/${trackingNumber}`;
  }
}
