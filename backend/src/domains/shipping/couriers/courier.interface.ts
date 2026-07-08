export type CarrierType = 'PROPIO' | 'ANDREANI' | 'MERCADO_ENVIOS';

export interface ShipmentRequest {
  orderId: string;
  orderRef: string;
  recipientName: string;
  recipientPhone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  weightKg?: number;
  manualTrackingNumber?: string;
}

export interface ShipmentResult {
  carrierType: CarrierType;
  trackingNumber: string;
  carrierShipmentId?: string;
  labelUrl?: string;
  externalUrl?: string;
}

export interface CarrierAdapter {
  readonly type: CarrierType;
  isConfigured(): Promise<boolean>;
  createShipment(request: ShipmentRequest): Promise<ShipmentResult>;
  getTrackingUrl?(trackingNumber: string): string;
}
