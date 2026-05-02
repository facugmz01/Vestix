import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { StorageLocation, PagedResponse } from '@/types';

export interface LocationFilters {
  search?: string;
  warehouseId?: string;
  type?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateLocationDto = Omit<StorageLocation, 'id' | 'createdAt' | 'warehouseName' | 'branchName'>;
export type UpdateLocationDto = Partial<CreateLocationDto>;

export const locationsApi = {
  getLocations: (filters?: LocationFilters) =>
    get<PagedResponse<StorageLocation>>('/locations', { params: cleanParams(filters ?? {}) }),

  getLocation: (id: string) =>
    get<StorageLocation>(`/locations/${id}`),

  createLocation: (dto: CreateLocationDto) =>
    post<StorageLocation>('/locations', dto),

  updateLocation: (id: string, dto: UpdateLocationDto) =>
    patch<StorageLocation>(`/locations/${id}`, dto),

  deleteLocation: (id: string) =>
    del(`/locations/${id}`),
};
