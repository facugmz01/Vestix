import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { Supplier, PagedResponse } from '@/types';

export interface SupplierFilters {
  search?: string;
  hasDebt?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateSupplierDto = Omit<Supplier, 'id' | 'createdAt' | 'account'> & {
  initialBalance?: number;
  currency?: string;
};
export type UpdateSupplierDto = Partial<Omit<CreateSupplierDto, 'initialBalance' | 'currency'>>;

export const suppliersApi = {
  getSuppliers: (filters?: SupplierFilters) =>
    get<PagedResponse<Supplier>>('/suppliers', { params: cleanParams(filters ?? {}) }),

  getSupplier: (id: string) =>
    get<Supplier>(`/suppliers/${id}`),

  createSupplier: (dto: CreateSupplierDto) =>
    post<Supplier>('/suppliers', dto),

  updateSupplier: (id: string, dto: UpdateSupplierDto) =>
    patch<Supplier>(`/suppliers/${id}`, dto),

  deleteSupplier: (id: string) =>
    del(`/suppliers/${id}`),

  getLedger: (id: string) =>
    get<any[]>(`/suppliers/${id}/ledger`), // Abstracting ledger entries
};
