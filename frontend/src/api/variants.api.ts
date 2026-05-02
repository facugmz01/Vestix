import { get, post, patch, del } from './client';
import type { ProductVariant } from '@/types';

export type CreateVariantDto = Omit<ProductVariant, 'id'>;
export type UpdateVariantDto = Partial<CreateVariantDto>;

export interface GenerateCombinationsDto {
  colors: string[];
  sizes: string[];
  basePrice: number;
}

export const variantsApi = {
  getVariantsByProduct: (productId: string) =>
    get<ProductVariant[]>(`/products/${productId}/variants`),

  getVariant: (id: string) =>
    get<ProductVariant>(`/variants/${id}`),

  createVariant: (dto: CreateVariantDto) =>
    post<ProductVariant>(`/products/${dto.productId}/variants`, dto),

  updateVariant: (id: string, dto: UpdateVariantDto) =>
    patch<ProductVariant>(`/variants/${id}`, dto),

  deleteVariant: (id: string) =>
    del(`/variants/${id}`),

  generateCombinations: (productId: string, dto: GenerateCombinationsDto) =>
    post<ProductVariant[]>(`/products/${productId}/variants/generate`, dto),
};
