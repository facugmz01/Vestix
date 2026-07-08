import { Injectable, BadRequestException } from '@nestjs/common';
import { CarrierType, CarrierAdapter, ShipmentRequest, ShipmentResult } from './couriers/courier.interface';
import { ProprioCourierAdapter } from './couriers/proprio.courier';
import { AndreaniCourierAdapter } from './couriers/andreani.courier';
import { MercadoEnviosCourierAdapter } from './couriers/mercado-envios.courier';

@Injectable()
export class CourierService {
  constructor(
    private readonly proprio: ProprioCourierAdapter,
    private readonly andreani: AndreaniCourierAdapter,
    private readonly mercadoEnvios: MercadoEnviosCourierAdapter,
  ) {}

  resolveAdapter(type?: string): CarrierAdapter {
    const carrierType = (type || 'PROPIO').toUpperCase() as CarrierType;
    switch (carrierType) {
      case 'ANDREANI':
        return this.andreani;
      case 'MERCADO_ENVIOS':
        return this.mercadoEnvios;
      default:
        return this.proprio;
    }
  }

  async createShipment(type: string | undefined, request: ShipmentRequest): Promise<ShipmentResult> {
    const adapter = this.resolveAdapter(type);
    if (type && type !== 'PROPIO' && !(await adapter.isConfigured())) {
      throw new BadRequestException(
        `El carrier ${type} no está configurado. Completá las credenciales en Ajustes → Tienda Web → Delivery.`,
      );
    }
    return adapter.createShipment(request);
  }

  getTrackingUrl(type: string | undefined, trackingNumber: string): string | undefined {
    const adapter = this.resolveAdapter(type);
    return adapter.getTrackingUrl?.(trackingNumber);
  }
}
