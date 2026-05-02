import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { Warehouse, PagedResponse } from '@/types';

export interface WarehouseFilters {
  search?: string;
  branchId?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateWarehouseDto = Omit<Warehouse, 'id' | 'createdAt' | 'branchName'>;
export type UpdateWarehouseDto = Partial<CreateWarehouseDto>;

export const warehousesApi = {
  getWarehouses: (filters?: WarehouseFilters) =>
    get<PagedResponse<Warehouse>>('/warehouses', { params: cleanParams(filters ?? {}) }),

  getWarehouse: (id: string) =>
    get<Warehouse>(`/warehouses/${id}`),

  createWarehouse: (dto: CreateWarehouseDto) =>
    post<Warehouse>('/warehouses', dto),

  updateWarehouse: (id: string, dto: UpdateWarehouseDto) =>
    patch<Warehouse>(`/warehouses/${id}`, dto),

  deleteWarehouse: (id: string) =>
    del(`/warehouses/${id}`),
};
