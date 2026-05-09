import { get, post, patch } from './client';
import { cleanParams } from './requestUtils';
import type { SaleOrder, PagedResponse } from '@/types';

export interface SalesFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  branchId?: string;
}

export interface CreateSaleDto {
  id: string;               // REQUIRED: Idempotency key from POS
  branchId: string;
  warehouseId: string;      // REQUIRED: Physical origin of stock
  source: 'POS' | 'ECOMMERCE' | 'BACKOFFICE'; // Aligned with backend OrderSource
  customerId?: string;
  
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'CUSTOMER_CREDIT' | 'BANK_TRANSFER';
  paymentAccountId?: string; // REQUIRED: For routing funds in Treasury
  
  createdAtIso?: string;    // REQUIRED: The exact offline timestamp
  status?: string;
  posGrandTotal?: number;
  cartDiscountTotal?: number;
  
  lines: {
    variantId: string;
    categoryId: string;     // REQUIRED: For backend RulesEngine
    quantity: number;
    unitPriceOverride?: number;
    discountPct?: number;
  }[];
}

export interface CheckoutResponse {
  status: 'SUCCESS' | 'ALREADY_PROCESSED';
  order: SaleOrder;
}

export const salesApi = {
  getSales: (filters?: SalesFilters) =>
    get<PagedResponse<SaleOrder>>('/sales/orders', { params: cleanParams(filters ?? {}) }),

  getSale: (id: string) =>
    get<SaleOrder>(`/sales/orders/${id}`),

  createSale: (dto: CreateSaleDto) =>
    post<CheckoutResponse>('/sales/checkout', dto),

  confirmQuotation: (id: string) =>
    post<SaleOrder>(`/sales/orders/${id}/confirm`, {}),

  cancelSale: (id: string) =>
    post<SaleOrder>(`/sales/orders/${id}/cancel`, {}),
};
