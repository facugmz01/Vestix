import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { StockTransfer, PagedResponse } from '@/types';

export interface TransferFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
}

export interface CreateTransferDto {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  lines: { variantId: string; quantity: number }[];
}

export interface DispatchTransferDto {
  trackingNumber?: string;
}

export interface ReceiveTransferDto {
  lines: { variantId: string; receivedQuantity: number }[];
}

export const transfersApi = {
  getTransfers: (filters?: TransferFilters) =>
    get<PagedResponse<StockTransfer>>('/inventory/transfers', { params: cleanParams(filters ?? {}) }),

  getTransfer: (id: string) =>
    get<StockTransfer>(`/inventory/transfers/${id}`),

  createTransfer: (dto: CreateTransferDto) =>
    post<StockTransfer>('/inventory/transfers', dto),

  dispatchTransfer: (id: string, dto: DispatchTransferDto) =>
    post<StockTransfer>(`/inventory/transfers/${id}/dispatch`, dto),

  receiveTransfer: (id: string, dto: ReceiveTransferDto) =>
    post<StockTransfer>(`/inventory/transfers/${id}/receive`, dto),

  cancelTransfer: (id: string) =>
    post<StockTransfer>(`/inventory/transfers/${id}/cancel`, {}),
};
