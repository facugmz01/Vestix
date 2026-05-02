import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { Branch, PagedResponse } from '@/types';

export interface BranchFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateBranchDto = Omit<Branch, 'id' | 'createdAt' | 'userCount'>;
export type UpdateBranchDto = Partial<CreateBranchDto>;

export const branchesApi = {
  getBranches: (filters?: BranchFilters) =>
    get<PagedResponse<Branch>>('/branches', { params: cleanParams(filters ?? {}) }),

  getBranch: (id: string) =>
    get<Branch>(`/branches/${id}`),

  createBranch: (dto: CreateBranchDto) =>
    post<Branch>('/branches', dto),

  updateBranch: (id: string, dto: UpdateBranchDto) =>
    patch<Branch>(`/branches/${id}`, dto),

  deleteBranch: (id: string) =>
    del(`/branches/${id}`),
};
