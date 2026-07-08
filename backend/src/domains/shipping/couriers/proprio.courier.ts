import { Injectable } from '@nestjs/common';
import { CarrierAdapter, CarrierType, ShipmentRequest, ShipmentResult } from './courier.interface';

@Injectable()
export class ProprioCourierAdapter implements CarrierAdapter {
  readonly type: CarrierType = 'PROPIO';

  async isConfigured(): Promise<boolean> {
    return true;
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResult> {
    return {
      carrierType: 'PROPIO',
      trackingNumber: request.manualTrackingNumber || `PRO-${request.orderRef}`,
    };
  }
}
