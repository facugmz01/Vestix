import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { SaleOrder, PagedResponse } from '@/types';

export interface CheckoutDto {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentType: string;
    documentNumber: string;
  };
  shippingInfo: {
    method: 'SHIPPING' | 'PICKUP';
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  paymentMethod: string;
  cartLines: {
    variantId: string;
    quantity: number;
    price: number; // Front-end context (validated by backend usually)
  }[];
}

export const storefrontOrdersApi = {
  // Submit checkout form
  checkout: (dto: CheckoutDto) =>
    post<SaleOrder>('/storefront/checkout', dto),

  // Get orders for the logged in customer
  getMyOrders: (page = 1, pageSize = 15) =>
    get<PagedResponse<SaleOrder>>('/storefront/my-orders', { params: { page, pageSize } }),

  // Get specific order detail and status
  getMyOrder: (id: string) =>
    get<SaleOrder>(`/storefront/my-orders/${id}`),
};
