import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { SystemUser, PagedResponse } from '@/types';

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateUserDto = Omit<SystemUser, 'id' | 'createdAt' | 'lastLoginAt'> & { password?: string };
export type UpdateUserDto = Partial<CreateUserDto>;

export const usersApi = {
  getUsers: (filters?: UserFilters) =>
    get<PagedResponse<SystemUser>>('/users', { params: cleanParams(filters ?? {}) }),

  getUser: (id: string) =>
    get<SystemUser>(`/users/${id}`),

  createUser: (dto: CreateUserDto) =>
    post<SystemUser>('/users', dto),

  updateUser: (id: string, dto: UpdateUserDto) =>
    patch<SystemUser>(`/users/${id}`, dto),

  deleteUser: (id: string) =>
    del(`/users/${id}`),
};
