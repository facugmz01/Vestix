import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
    if (request.manualTrackingNumber) {
      return {
        carrierType: 'ANDREANI',
        trackingNumber: request.manualTrackingNumber,
      };
    }

    const settings = await this.settingsService.getStorefrontSettings();
    const cfg = settings.deliverySettings?.carriers?.andreani;

    if (!(await this.isConfigured())) {
      throw new BadRequestException(
        'Andreani no está configurado. Ingresá un número de seguimiento manual o configurá las credenciales.',
      );
    }

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
      const text = await response.text();
      this.logger.error(`Andreani API ${response.status}: ${text}`);
      throw new BadRequestException(`Andreani API error (${response.status}). Use manual tracking or retry later.`);
    }

    const data = await response.json();
    const trackingNumber = data?.numeroDeEnvio || data?.trackingNumber;
    if (!trackingNumber) {
      throw new BadRequestException('Andreani API did not return a tracking number');
    }

    return {
      carrierType: 'ANDREANI',
      trackingNumber,
      carrierShipmentId: data?.id?.toString(),
      labelUrl: data?.etiquetaUrl,
      externalUrl: `https://www.andreani.com/#!/informacionEnvio/${trackingNumber}`,
    };
  }

  getTrackingUrl(trackingNumber: string): string {
    return `https://www.andreani.com/#!/informacionEnvio/${trackingNumber}`;
  }
}
