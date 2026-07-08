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

export interface DriverAssignment {
  id: string;
  status: string;
  fulfillmentStatus?: string;
  orderRef?: string;
  saleOrderId?: string;
  driverName?: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    phone?: string;
  };
  lines: Array<{ quantity: number; productName?: string }>;
  dispatchedAt?: string;
  driverToken?: string;
  settings?: {
    requirePhotoOnDelivery: boolean;
    enableGeofence: boolean;
  };
}

export const deliveryPortalApi = {
  listAssignments: (params?: { status?: string; page?: number; pageSize?: number }) =>
    get<{ data: DriverAssignment[]; total: number; page: number; pageSize: number }>(
      '/delivery-portal/assignments',
      { params },
    ),

  getAssignment: (deliveryId: string) =>
    get<DriverAssignment>(`/delivery-portal/assignments/${deliveryId}`),

  updateLocation: (deliveryId: string, latitude: number, longitude: number) =>
    post(`/delivery-portal/assignments/${deliveryId}/location`, { latitude, longitude }),

  markArrived: (deliveryId: string) =>
    post(`/delivery-portal/assignments/${deliveryId}/arrive`, {}),

  uploadPhoto: (deliveryId: string, file: File) => {
    const fd = new FormData();
    fd.append('photo', file);
    return postForm<{ proofPhotoUrl: string }>(`/delivery-portal/assignments/${deliveryId}/photo`, fd);
  },

  completeDelivery: (
    deliveryId: string,
    otp: string,
    latitude?: number,
    longitude?: number,
  ) => post(`/delivery-portal/assignments/${deliveryId}/complete`, { otp, latitude, longitude }),
};
