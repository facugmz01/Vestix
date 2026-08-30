import type { AxiosRequestConfig } from 'axios';
import { get } from './client';
import { cleanParams } from './requestUtils';
import type { PagedResponse } from '@/types';

// ─── Storefront-specific types (match the /catalog/public API response) ──────
// These intentionally differ from the internal `Product` type used in the admin,
// because the public catalog serializer flattens brand/category to strings.

export interface StorefrontVariant {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  stock: number;
  price?: number;
  basePrice?: number;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  description?: string;
  brand?: string | null;
  category?: string | null;
  price: number;
  maxPrice?: number;
  basePrice: number;
  inStock: boolean;
  availableQuantity: number;
  images?: string[];
  variants?: StorefrontVariant[];
  relatedProducts?: Array<{ id: string; name: string; price: number; images?: string[] }>;
}

export interface StorefrontFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  search?: string;
  searchQuery?: string;
  q?: string;
  categoryId?: string;
  brand?: string;
  sortBy?: 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';
}

import { StorefrontSettings as AdminStorefrontSettings, PwaSettings } from './settings.api';

export interface StorefrontSettings extends AdminStorefrontSettings {
  pwa?: PwaSettings;
  paymentMethods?: Array<{ id: string; name: string; type: string }>;
}

export const storefrontApi = {
  getProducts: (filters?: StorefrontFilters, config?: AxiosRequestConfig) => {
    const { search, searchQuery, q, ...rest } = filters || {};
    const queryTerm = search || searchQuery || q;
    return get<PagedResponse<StorefrontProduct>>('/catalog/public', {
      ...config,
      params: cleanParams({ ...rest, searchQuery: queryTerm }),
    });
  },

  searchQuick: (query: string, limit = 6, config?: AxiosRequestConfig) => {
    return get<PagedResponse<StorefrontProduct>>('/catalog/public', {
      ...config,
      params: cleanParams({ searchQuery: query.trim(), limit, pageSize: limit }),
    });
  },

  getProduct: (id: string, config?: AxiosRequestConfig) =>
    get<StorefrontProduct>(`/catalog/public/${id}`, config),

  getSettings: (config?: AxiosRequestConfig) =>
    get<StorefrontSettings>('/storefront/settings', config),
};


