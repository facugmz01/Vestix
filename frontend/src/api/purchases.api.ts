import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { PurchaseOrder, PagedResponse } from '@/types';

export interface PurchaseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  supplierId?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  expectedDeliveryDate?: string;
  lines: { variantId: string; orderedQuantity: number; unitCost: number }[];
}

export interface UpdatePurchaseOrderDto {
  expectedDeliveryDate?: string;
  lines?: { variantId: string; orderedQuantity: number; unitCost: number }[];
}

export interface ReceivePurchaseDto {
  lines: { variantId: string; receivedQuantity: number }[];
}

export const purchasesApi = {
  getOrders: (filters?: PurchaseFilters) =>
    get<PagedResponse<PurchaseOrder>>('/purchasing/orders', { params: cleanParams(filters ?? {}) }),

  getOrder: (id: string) =>
    get<PurchaseOrder>(`/purchasing/orders/${id}`),

  createOrder: (dto: CreatePurchaseOrderDto) =>
    post<PurchaseOrder>('/purchasing/orders', dto),

  updateOrder: (id: string, dto: UpdatePurchaseOrderDto) =>
    patch<PurchaseOrder>(`/purchasing/orders/${id}`, dto),

  issueOrder: (id: string) =>
    post<PurchaseOrder>(`/purchasing/orders/${id}/issue`, {}),

  receiveOrder: (id: string, dto: ReceivePurchaseDto) =>
    post<PurchaseOrder>(`/purchasing/orders/${id}/receive`, dto),

  cancelOrder: (id: string) =>
    post<PurchaseOrder>(`/purchasing/orders/${id}/cancel`, {}),
};
