import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { PurchaseOrder, PagedResponse, Supplier, ProductVariant } from '@/types';

export interface PurchaseFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  supplierId?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  destinationWarehouseId: string;
  expectedDeliveryDate?: string;
  lines: { variantId: string; orderedQuantity: number; unitCost: number }[];
}

export interface UpdatePurchaseOrderDto {
  destinationWarehouseId?: string;
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
    post<{ status: string; discrepancy: boolean }>(`/purchasing/orders/${id}/receive`, dto),

  bulkImportPurchases: (rows: any[], updateStock: boolean, paymentResolution: string, warehouseId: string) =>
    post<{ success: boolean; createdCount: number; errorCount: number; errors: string[] }>('/purchasing/bulk-import', { rows, updateStock, paymentResolution, warehouseId }),

  cancelOrder: (id: string) =>
    post<PurchaseOrder>(`/purchasing/orders/${id}/cancel`, {}),

  removeOrder: (id: string) =>
    del<void>(`/purchasing/orders/${id}`),

  getSuppliers: () =>
    get<PagedResponse<Supplier>>('/suppliers'),

  searchCatalog: (query: string, filters?: { categoryId?: string; brandId?: string }) =>
    get<ProductVariant[]>('/pos/catalog/search', {
      params: cleanParams({ q: query, ...filters }),
    }),

  processDirect: (data: unknown) =>
    post<unknown>('/purchasing/direct', data),

  autoReplenish: () =>
    post<{ message: string; ordersCreated: number }>('/purchasing/auto-replenish'),
};
