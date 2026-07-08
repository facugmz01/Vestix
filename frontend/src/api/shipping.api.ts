import { get, post } from './client';

export interface ShippingAddress {
  fullName: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface DeliveryTracking {
  status: string;
  driverName?: string;
  lastLatitude?: number;
  lastLongitude?: number;
  lastLocationAt?: string;
  hasDeliveryCode?: boolean;
}

export interface OrderTracking {
  orderId: string;
  status: string;
  saleOrderStatus: string;
  shippingMethodName?: string;
  shippingCost: number;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  courierName?: string;
  timeline: {
    paidAt?: string;
    pickedAt?: string;
    packedAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    dispatchedAt?: string;
  };
  delivery?: DeliveryTracking | null;
  lines: any[];
  grandTotal: number;
  customerName?: string;
}

export interface DispatchDeliveryDto {
  driverName: string;
  driverPhone?: string;
  courierName?: string;
  trackingNumber?: string;
  notes?: string;
}

export interface FulfillmentListItem {
  id: string;
  saleOrderId: string;
  status: string;
  trackingNumber?: string;
  courierName?: string;
  shippedAt?: string;
  deliveredAt?: string;
  saleOrder: {
    id: string;
    grandTotal: number;
    status: string;
    createdAt: string;
    shippingMethodName?: string;
    shippingCost?: number;
    customer?: { fullName: string; phone?: string };
    shippingAddress?: ShippingAddress;
    lines: any[];
  };
  delivery?: {
    id: string;
    status: string;
    driverName?: string;
    dispatchedAt?: string;
    lastLatitude?: number;
    lastLongitude?: number;
  };
}

export const shippingApi = {
  listDeliveries: (params?: { status?: string; page?: number; pageSize?: number }) =>
    get<{ data: FulfillmentListItem[]; total: number; page: number; pageSize: number }>(
      '/shipping/deliveries',
      { params },
    ),

  getOrderShipping: (orderId: string) =>
    get<any>(`/shipping/orders/${orderId}`),

  startPicking: (orderId: string) =>
    post(`/shipping/orders/${orderId}/pick`, {}),

  markPacked: (orderId: string) =>
    post(`/shipping/orders/${orderId}/pack`, {}),

  dispatch: (orderId: string, dto: DispatchDeliveryDto) =>
    post(`/shipping/orders/${orderId}/dispatch`, dto),

  updateLocation: (orderId: string, latitude: number, longitude: number) =>
    post(`/shipping/orders/${orderId}/location`, { latitude, longitude }),

  markArrived: (orderId: string) =>
    post(`/shipping/orders/${orderId}/arrive`, {}),

  completeDelivery: (orderId: string, otp: string, notes?: string) =>
    post(`/shipping/orders/${orderId}/complete`, { otp, notes }),

  completeManual: (orderId: string, notes?: string) =>
    post(`/shipping/orders/${orderId}/complete-manual`, { notes }),
};
