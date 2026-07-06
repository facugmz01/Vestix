import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { Product, Category, Brand, PagedResponse } from '@/types';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isPublished?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt'>;
export type UpdateProductDto = Partial<CreateProductDto>;

export const productsApi = {
  getProducts: (filters?: ProductFilters) =>
    get<PagedResponse<Product>>('/products', { params: cleanParams(filters ?? {}) }),

  getProduct: (id: string) =>
    get<Product>(`/products/${id}`),

  getVariants: (search?: string) =>
    get<any[]>('/variants', { params: cleanParams({ search }) }),

  createProduct: (dto: CreateProductDto) =>
    post<Product>('/products', dto),

  bulkValidate: (rows: any[]) =>
    post<{ validRows: any[]; conflicts: any[] }>('/products/bulk-validate', { rows }),

  bulkImport: (rows: any[]) =>
    post<{ success: boolean; createdCount: number; updatedCount: number }>('/products/bulk-import', { rows }),

  bulkUpdatePrices: (dto: { categoryId?: string; brandId?: string; percentage: number }) =>
    post<{ success: boolean; updatedCount: number }>('/products/bulk-update-prices', dto),

  updateProduct: (id: string, dto: UpdateProductDto) =>
    patch<Product>(`/products/${id}`, dto),

  deleteProduct: (id: string) =>
    del(`/products/${id}`),

  clearCatalog: () =>
    post<{ success: boolean }>('/products/clear'),

  publishAll: () =>
    post<{ success: boolean; count: number; skipped?: number }>('/products/bulk-publish-all'),

  duplicateProduct: (id: string) =>
    post<Product>(`/products/${id}/duplicate`),

  getPublishReadiness: (id: string) =>
    get<{ ready: boolean; issues: string[] }>(`/products/${id}/publish-readiness`),

  uploadProductImage: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return post<{ url: string }>(`/products/${productId}/images`, formData);
  },

  deleteProductImage: (productId: string, imageUrl: string) =>
    del(`/products/${productId}/images`, { params: { url: imageUrl } }),

  getCategories: () => get<Category[]>('/categories'),
  createCategory: (dto: { name: string; parentId?: string }) => post<Category>('/categories', dto),
  updateCategory: (id: string, dto: { name?: string; parentId?: string }) => patch<Category>(`/categories/${id}`, dto),
  deleteCategory: (id: string) => del(`/categories/${id}`),

  getBrands: () => get<Brand[]>('/brands'),
  createBrand: (dto: { name: string }) => post<Brand>('/brands', dto),
  updateBrand: (id: string, dto: { name?: string }) => patch<Brand>(`/brands/${id}`, dto),
  deleteBrand: (id: string) => del(`/brands/${id}`),

  getAttributes: () => get<any[]>('/attributes'),
  createAttribute: (dto: { name: string; values: string[] }) => post<any>('/attributes', dto),
  updateAttribute: (id: string, dto: { name?: string; values?: string[] }) => patch<any>(`/attributes/${id}`, dto),
  deleteAttribute: (id: string) => del(`/attributes/${id}`),

  getPriceLists: () => get<{ data: any[] } | any[]>(`/price-lists?pageSize=100`).then(res =>
    Array.isArray(res) ? res : (res as { data: any[] }).data ?? [],
  ),

  getPriceHistory: (id: string) =>
    get<Array<{ id: string; variantId: string; sku?: string; oldPrice: number; newPrice: number; source: string; createdAt: string }>>(
      `/products/${id}/price-history`,
    ),

  migrateBase64Images: () =>
    post<{ migratedProducts: number; migratedImages: number }>('/products/migrate-base64-images'),
};
