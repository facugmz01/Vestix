import { get, post, patch, del } from './client';

export interface ProductCollection {
  id: string;
  name: string;
  season?: string | null;
  year?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: { product: { id: string; name: string; baseSku?: string } }[];
  _count?: { products: number };
}

export interface CreateCollectionDto {
  name: string;
  season?: string;
  year?: number;
  isActive?: boolean;
  productIds?: string[];
}

export type UpdateCollectionDto = Partial<CreateCollectionDto>;

export const collectionsApi = {
  getAll: (activeOnly?: boolean) =>
    get<ProductCollection[]>('/collections', { params: activeOnly ? { activeOnly: 'true' } : {} }),

  getOne: (id: string) =>
    get<ProductCollection>(`/collections/${id}`),

  create: (dto: CreateCollectionDto) =>
    post<ProductCollection>('/collections', dto),

  update: (id: string, dto: UpdateCollectionDto) =>
    patch<ProductCollection>(`/collections/${id}`, dto),

  remove: (id: string) =>
    del(`/collections/${id}`),
};
