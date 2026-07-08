import { get, post, patch } from './client';
import { cleanParams } from './requestUtils';
import type { SaleOrder, PagedResponse } from '@/types';
import type { SharedCreateSaleDto } from '@shared/types';

export interface SalesFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  customerId?: string;
  branchId?: string;
}

export type CreateSaleDto = SharedCreateSaleDto;

export interface CheckoutResponse {
  status: 'SUCCESS' | 'ALREADY_PROCESSED';
  order: SaleOrder;
}

export const salesApi = {
  getSales: (filters?: SalesFilters) =>
    get<PagedResponse<SaleOrder>>('/sales/orders', { params: cleanParams((filters as any) ?? {}) }),

  getSale: (id: string) =>
    get<SaleOrder>(`/sales/orders/${id}`),

  createSale: (dto: CreateSaleDto) =>
    post<CheckoutResponse>('/sales/checkout', dto),

  confirmQuotation: (id: string) =>
    post<SaleOrder>(`/sales/orders/${id}/confirm`, {}),

  confirmPayment: (id: string, payload?: { paymentReference?: string }) =>
    post<SaleOrder>(`/sales/orders/${id}/confirm-payment`, payload ?? {}),

  cancelSale: (id: string) =>
    post<SaleOrder>(`/sales/orders/${id}/cancel`, {}),

  bulkImportSales: (rows: any[], updateStock: boolean, paymentResolution: string, branchId: string) =>
    post<{ success: boolean; createdCount: number; errorCount: number; errors: string[] }>('/sales/bulk-import', { rows, updateStock, paymentResolution, branchId }),

  sendManualReceipt: (id: string, payload: { channel: 'EMAIL' | 'WHATSAPP'; recipient: string }) =>
    post<{ success: boolean; message: string }>(`/sales/orders/${id}/send-receipt`, payload),

  updateStatus: (id: string, status: string) =>
    patch<SaleOrder>(`/sales/${id}/status`, { status }),
};
