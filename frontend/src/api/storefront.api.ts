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
  getProducts: (filters?: StorefrontFilters) =>
    get<PagedResponse<Product>>('/catalog/public', { params: cleanParams({ ...filters }) }),

  getProduct: (id: string) =>
    get<Product>(`/catalog/public/${id}`),
};
