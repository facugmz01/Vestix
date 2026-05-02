import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { SaleReturn, ReturnAction, ItemCondition, PagedResponse } from '@/types';

export interface ReturnsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  branchId?: string;
}

export interface CreateReturnItemDto {
  orderLineId: string;
  variantId: string;
  quantity: number;
  condition: ItemCondition;
  reason: string;
}

export interface CreateReturnDto {
  saleOrderId: string;
  branchId: string;
  action: ReturnAction;
  items: CreateReturnItemDto[];
}

export const returnsApi = {
  getReturns: (filters?: ReturnsFilters) =>
    get<PagedResponse<SaleReturn>>('/sales/returns', { params: cleanParams(filters ?? {}) }),

  getReturn: (id: string) =>
    get<SaleReturn>(`/sales/returns/${id}`),

  createReturn: (dto: CreateReturnDto) =>
    post<SaleReturn>('/sales/returns', dto),

  approveReturn: (id: string) =>
    post<SaleReturn>(`/sales/returns/${id}/approve`, {}),

  rejectReturn: (id: string) =>
    post<SaleReturn>(`/sales/returns/${id}/reject`, {}),
};
