import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { PriceList, PriceListItem, PagedResponse } from '@/types';

export interface PriceListFilters {
  search?: string;
  isActive?: boolean;
  type?: 'BASE' | 'MODIFIER';
  page?: number;
  pageSize?: number;
}

export type CreatePriceListDto = Omit<PriceList, 'id' | 'createdAt'>;
export type UpdatePriceListDto = Partial<CreatePriceListDto>;

export const priceListsApi = {
  getPriceLists: (filters?: PriceListFilters) =>
    get<PagedResponse<PriceList>>('/price-lists', { params: cleanParams(filters ?? {}) }),

  getPriceList: (id: string) =>
    get<PriceList>(`/price-lists/${id}`),

  createPriceList: (dto: CreatePriceListDto) =>
    post<PriceList>('/price-lists', dto),

  updatePriceList: (id: string, dto: UpdatePriceListDto) =>
    patch<PriceList>(`/price-lists/${id}`, dto),

  deletePriceList: (id: string) =>
    del(`/price-lists/${id}`),

  // Items
  getItems: (priceListId: string, page = 1, pageSize = 50) =>
    get<PagedResponse<PriceListItem>>(`/price-lists/${priceListId}/items`, { params: { page, pageSize } }),

  updateItemPrice: (priceListId: string, variantId: string, overridePrice: number) =>
    patch<PriceListItem>(`/price-lists/${priceListId}/items/${variantId}`, { overridePrice }),

  // Assignments
  assignToCustomers: (priceListId: string, customerIds: string[]) =>
    post(`/price-lists/${priceListId}/assign-customers`, { customerIds }),
};
