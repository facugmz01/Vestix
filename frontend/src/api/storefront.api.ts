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
  stock: number; // total available across all warehouses
}

export interface StorefrontProduct {
  id: string;
  name: string;
  description?: string;
  brand?: string | null;
  category?: string | null;
  price: number;
  basePrice: number;
  inStock: boolean;
  availableQuantity: number;
  images?: string[];
  variants?: StorefrontVariant[];
}

export interface StorefrontFilters {
  page?: number;
  pageSize?: number;
  search?: string;
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
  getProducts: (filters?: StorefrontFilters) => {
    const { search, ...rest } = filters || {};
    return get<PagedResponse<StorefrontProduct>>('/catalog/public', {
      params: cleanParams({ ...rest, searchQuery: search })
    });
  },

  getProduct: (id: string) =>
    get<StorefrontProduct>(`/catalog/public/${id}`),

  getSettings: () =>
    get<StorefrontSettings>('/storefront/settings'),
};

