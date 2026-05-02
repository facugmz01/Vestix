import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { Promotion, PagedResponse } from '@/types';

export interface PromotionFilters {
  search?: string;
  isActive?: boolean;
  type?: string;
  page?: number;
  pageSize?: number;
}

export type CreatePromotionDto = Omit<Promotion, 'id' | 'createdAt' | 'conflictsWith'>;
export type UpdatePromotionDto = Partial<CreatePromotionDto>;

export interface ImpactPreview {
  affectedVariantsCount: number;
  averageDiscountPercentage: number;
  sampleVariants: { sku: string; originalPrice: number; discountedPrice: number }[];
}

export interface BulkUpdateDto {
  promotionId?: string;
  priceListId?: string;
  action: 'APPLY_PROMO' | 'APPLY_PRICE_LIST_MODIFIER' | 'FLATTEN_PRICES';
}

export const promotionsApi = {
  getPromotions: (filters?: PromotionFilters) =>
    get<PagedResponse<Promotion>>('/promotions', { params: cleanParams(filters ?? {}) }),

  getPromotion: (id: string) =>
    get<Promotion>(`/promotions/${id}`),

  createPromotion: (dto: CreatePromotionDto) =>
    post<Promotion>('/promotions', dto),

  updatePromotion: (id: string, dto: UpdatePromotionDto) =>
    patch<Promotion>(`/promotions/${id}`, dto),

  deletePromotion: (id: string) =>
    del(`/promotions/${id}`),

  getConflicts: () =>
    get<Array<{ promoIdA: string; promoIdB: string; description: string }>>('/promotions/conflicts'),

  getImpactPreview: (id: string) =>
    get<ImpactPreview>(`/promotions/${id}/impact-preview`),

  // Bulk Operations
  executeBulkUpdate: (dto: BulkUpdateDto) =>
    post<{ updatedCount: number }>('/promotions/bulk-update', dto),
};
