import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { StockReservation, PagedResponse } from '@/types';

export interface ReservationsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  branchId?: string;
}

export interface CreateReservationDto {
  branchId: string;
  customerId?: string;
  expiresAt: string;
  notes?: string;
  lines: {
    variantId: string;
    quantity: number;
  }[];
}

export const reservationsApi = {
  getReservations: (filters?: ReservationsFilters) =>
    get<PagedResponse<StockReservation>>('/inventory/reservations', { params: cleanParams(filters ?? {}) }),

  getReservation: (id: string) =>
    get<StockReservation>(`/inventory/reservations/${id}`),

  createReservation: (dto: CreateReservationDto) =>
    post<StockReservation>('/inventory/reservations', dto),

  consumeReservation: (id: string, saleOrderId?: string) =>
    post<StockReservation>(`/inventory/reservations/${id}/consume`, { saleOrderId }),

  releaseReservation: (id: string) =>
    post<StockReservation>(`/inventory/reservations/${id}/release`, {}),
};
