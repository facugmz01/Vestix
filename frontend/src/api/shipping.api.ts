import { get, post } from './client';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function postForm<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { method: 'POST', body: formData, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message || 'Request failed'), { response: { data: err } });
  }
  return res.json();
}

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
  carrierType?: 'PROPIO' | 'ANDREANI' | 'MERCADO_ENVIOS';
  driverUserId?: string;
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
  listDrivers: () => get<Array<{ id: string; fullName: string | null; email: string }>>('/shipping/drivers'),

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
    post<DispatchResult>(`/shipping/orders/${orderId}/dispatch`, dto),

  updateLocation: (orderId: string, latitude: number, longitude: number) =>
    post(`/shipping/orders/${orderId}/location`, { latitude, longitude }),

  markArrived: (orderId: string) =>
    post(`/shipping/orders/${orderId}/arrive`, {}),

  completeDelivery: (orderId: string, otp: string, notes?: string) =>
    post(`/shipping/orders/${orderId}/complete`, { otp, notes }),

  completeManual: (orderId: string, notes?: string) =>
    post(`/shipping/orders/${orderId}/complete-manual`, { notes }),

  getPublicTracking: (token: string) =>
    get<PublicTracking>(`/track/${token}`),
};

export interface PublicTracking {
  orderRef: string;
  status: string;
  trackingNumber?: string;
  courierName?: string;
  city?: string;
  state?: string;
  timeline: {
    paidAt?: string;
    packedAt?: string;
    shippedAt?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
  };
  delivery?: {
    status: string;
    lastLatitude?: number;
    lastLongitude?: number;
    lastLocationAt?: string;
  };
  itemCount: number;
}

export interface DispatchResult {
  fulfillment: any;
  delivery: any;
  links: { trackingUrl: string; driverUrl: string };
  otpForAdmin: string;
}

export const driverApi = {
  getDelivery: (token: string) =>
    get<any>(`/driver/${token}`),

  updateLocation: (token: string, latitude: number, longitude: number) =>
    post(`/driver/${token}/location`, { latitude, longitude }),

  markArrived: (token: string) =>
    post(`/driver/${token}/arrive`, {}),

  uploadPhoto: (token: string, file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return postForm<{ proofPhotoUrl: string }>(`/driver/${token}/photo`, fd);
  },

  completeDelivery: (token: string, otp: string, latitude?: number, longitude?: number) =>
    post(`/driver/${token}/complete`, { otp, latitude, longitude }),
};
