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

  createProduct: (dto: CreateProductDto) =>
    post<Product>('/products', dto),

  updateProduct: (id: string, dto: UpdateProductDto) =>
    patch<Product>(`/products/${id}`, dto),

  deleteProduct: (id: string) =>
    del(`/products/${id}`),

  // Taxonomy
  getCategories: () => get<Category[]>('/categories'),
  createCategory: (dto: { name: string; parentId?: string }) => post<Category>('/categories', dto),
  updateCategory: (id: string, dto: { name?: string; parentId?: string }) => patch<Category>(`/categories/${id}`, dto),
  deleteCategory: (id: string) => del(`/categories/${id}`),

  getBrands: () => get<Brand[]>('/brands'),
  createBrand: (dto: { name: string }) => post<Brand>('/brands', dto),
  updateBrand: (id: string, dto: { name?: string }) => patch<Brand>(`/brands/${id}`, dto),
  deleteBrand: (id: string) => del(`/brands/${id}`),

  // Attributes
  getAttributes: () => get<any[]>('/attributes'),
  createAttribute: (dto: { name: string; values: string[] }) => post<any>('/attributes', dto),
  deleteAttribute: (id: string) => del(`/attributes/${id}`),

  // Price Lists
  getPriceLists: () => get<any[]>(`/pricing?t=${Date.now()}`),
  createPriceList: (dto: { name: string; margin: number }) => post<any>('/pricing', dto),
  updatePriceList: (id: string, dto: { name?: string; margin?: number }) => patch<any>(`/pricing/${id}`, dto),
  deletePriceList: (id: string) => del(`/pricing/${id}`),
};
