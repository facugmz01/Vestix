import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { PurchaseOrder, Supplier } from '@/types';

export interface POFilters {
  status?:     string;
  supplierId?: string;
  from?:       string;
  to?:         string;
  page?:       number;
  pageSize?:   number;
}

export interface SupplierFilters {
  search?: string;
  page?:   number;
}

export interface ReceiveGoodsDto {
  lines: { lineId: string; receivedQuantity: number }[];
}

export const purchasingApi = {
  // ── Purchase Orders ───────────────────────────────────────────────────────
  getOrders: (filters?: POFilters) =>
    get<PurchaseOrder[]>('/purchasing', { params: cleanParams(filters ?? {}) }),

  getOrder: (id: string) =>
    get<PurchaseOrder>(`/purchasing/${id}`),

  createOrder: (dto: Partial<PurchaseOrder>) =>
    post<PurchaseOrder>('/purchasing', dto),

  issueOrder: (id: string) =>
    post<PurchaseOrder>(`/purchasing/${id}/issue`),

  receiveGoods: (id: string, dto: ReceiveGoodsDto) =>
    post<{ status: string }>(`/purchasing/${id}/receive`, dto),

  validateReceipt: (id: string, userId: string) =>
    post<{ status: string }>(`/purchasing/${id}/validate`, { userId }),

  // ── Suppliers ─────────────────────────────────────────────────────────────
  getSuppliers: (filters?: SupplierFilters) =>
    get<Supplier[]>('/suppliers', { params: cleanParams(filters ?? {}) }),

  getSupplier: (id: string) =>
    get<Supplier>(`/suppliers/${id}`),

  createSupplier: (dto: Partial<Supplier>) =>
    post<Supplier>('/suppliers', dto),

  getSupplierLedger: (id: string) =>
    get<unknown[]>(`/suppliers/${id}/ledger`),

  registerInvoice: (id: string, amount: number, invoiceNumber: string) =>
    post(`/suppliers/${id}/invoice`, { amount, invoiceNumber }),

  processPayment: (id: string, amount: number, transactionId: string) =>
    post(`/suppliers/${id}/payment`, { amount, transactionId }),
};
