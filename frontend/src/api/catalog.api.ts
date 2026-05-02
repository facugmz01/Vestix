import { get, post, patch, del, upload } from './client';
import { cleanParams } from './requestUtils';
import type { Product, ProductVariant, Category, Brand } from '@/types';

export interface ProductFilters {
  page?:       number;
  pageSize?:   number;
  search?:     string;
  categoryId?: string;
  brandId?:    string;
  isActive?:   boolean;
  isPublished?: boolean;
}

export interface PublicCatalogFilters {
  searchQuery?: string;
  categoryId?:  string;
  brandId?:     string;
  inStockOnly?: boolean;
  minPrice?:    number;
  maxPrice?:    number;
  page?:        number;
  pageSize?:    number;
}

export const catalogApi = {
  // ── Products ──────────────────────────────────────────────────────────────
  getProducts: (filters?: ProductFilters) =>
    get<Product[]>('/products', { params: cleanParams(filters ?? {}) }),

  getProduct: (id: string) =>
    get<Product>(`/products/${id}`),

  createProduct: (dto: Omit<Product, 'id' | 'createdAt'>) =>
    post<Product>('/products', dto),

  updateProduct: (id: string, dto: Partial<Omit<Product, 'id' | 'createdAt'>>) =>
    patch<Product>(`/products/${id}`, dto),

  deleteProduct: (id: string) =>
    del(`/products/${id}`),

  // ── Product images ────────────────────────────────────────────────────────
  uploadProductImage: (productId: string, file: File) =>
    upload<{ url: string }>(`/products/${productId}/images`, file, 'image'),

  deleteProductImage: (productId: string, imageUrl: string) =>
    del(`/products/${productId}/images`, { params: { url: imageUrl } }),

  // ── Variants ──────────────────────────────────────────────────────────────
  getVariants: (productId: string) =>
    get<ProductVariant[]>(`/products/${productId}/variants`),

  createVariant: (productId: string, dto: Omit<ProductVariant, 'id' | 'productId'>) =>
    post<ProductVariant>(`/products/${productId}/variants`, dto),

  updateVariant: (productId: string, variantId: string, dto: Partial<ProductVariant>) =>
    patch<ProductVariant>(`/products/${productId}/variants/${variantId}`, dto),

  // ── Categories ────────────────────────────────────────────────────────────
  getCategories: () =>
    get<Category[]>('/categories'),

  createCategory: (dto: Omit<Category, 'id'>) =>
    post<Category>('/categories', dto),

  // ── Brands ────────────────────────────────────────────────────────────────
  getBrands: () =>
    get<Brand[]>('/brands'),

  createBrand: (dto: Omit<Brand, 'id'>) =>
    post<Brand>('/brands', dto),

  // ── Public storefront ─────────────────────────────────────────────────────
  getPublicCatalog: (filters?: PublicCatalogFilters) =>
    get<{ metadata: { total: number; filtered: boolean }; data: unknown[] }>(
      '/catalog/public',
      { params: cleanParams(filters ?? {}) }
    ),

  // ── POS offline sync ──────────────────────────────────────────────────────
  getPosSyncCatalog: (branchId: string) =>
    get<{ status: string; timestamp: string; data: unknown[] }>(
      `/catalog/pos-sync/${branchId}`
    ),
};
