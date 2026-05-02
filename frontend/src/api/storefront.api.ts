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
    get<PagedResponse<Product>>('/catalog/products', { params: cleanParams({ ...filters, isPublished: true }) }), // Assuming backend supports this or we just fetch products.

  getProduct: (id: string) =>
    get<Product>(`/catalog/products/${id}`),
};
