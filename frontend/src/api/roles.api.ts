import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { CustomRole, PagedResponse } from '@/types';

export interface RoleFilters {
  search?: string;
  page?: number;
  pageSize?: number;
}

export type CreateRoleDto = Omit<CustomRole, 'id' | 'createdAt' | 'isSystem'>;
export type UpdateRoleDto = Partial<CreateRoleDto>;

export const rolesApi = {
  getRoles: (filters?: RoleFilters) =>
    get<PagedResponse<CustomRole>>('/roles', { params: cleanParams(filters ?? {}) }),

  getRole: (id: string) =>
    get<CustomRole>(`/roles/${id}`),

  createRole: (dto: CreateRoleDto) =>
    post<CustomRole>('/roles', dto),

  updateRole: (id: string, dto: UpdateRoleDto) =>
    patch<CustomRole>(`/roles/${id}`, dto),

  deleteRole: (id: string) =>
    del(`/roles/${id}`),
};
