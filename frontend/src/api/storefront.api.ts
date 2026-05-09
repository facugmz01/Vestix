import { get } from './client';
import { cleanParams } from './requestUtils';
import type { Product, PagedResponse } from '@/types';

export interface StorefrontFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  brand?: string;
  sortBy?: 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';
}

export const storefrontApi = {
  getProducts: (filters?: StorefrontFilters) => {
    const { search, ...rest } = filters || {};
    return get<PagedResponse<Product>>('/catalog/public', {
      params: cleanParams({ ...rest, searchQuery: search })
    });
  },

  getProduct: (id: string) =>
    get<Product>(`/catalog/public/${id}`),
};
