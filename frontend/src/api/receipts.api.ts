import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { GoodsReceipt, PagedResponse } from '@/types';

export interface ReceiptFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface DraftReceiptDto {
  purchaseOrderId: string;
  receivedByUserId?: string; // Optional, usually derived from auth context in backend
  scannedItems: { poLineItemId: string; variantId: string; quantity: number }[];
}

export const receiptsApi = {
  getReceipts: (filters?: ReceiptFilters) =>
    get<PagedResponse<GoodsReceipt>>('/purchasing/receipts', { params: cleanParams(filters ?? {}) }),

  getReceipt: (id: string) =>
    get<GoodsReceipt>(`/purchasing/receipts/${id}`),

  draftReceipt: (dto: DraftReceiptDto) =>
    post<GoodsReceipt>('/purchasing/receipts/draft', dto),

  validateReceipt: (id: string) =>
    post<GoodsReceipt>(`/purchasing/receipts/${id}/validate`, {}),
};
