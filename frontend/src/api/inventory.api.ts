import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { StockLevel, InventoryMovement, PagedResponse } from '@/types';

export interface EnrichedStockLevel extends StockLevel {
  id: string; // composite key or backend ID
  variantSku: string;
  productName: string;
  warehouseName: string;
  branchName: string;
  lastUpdated: string;
}

export interface StockFilters {
  search?: string;
  branchId?: string;
  warehouseId?: string;
  page?: number;
  pageSize?: number;
}

export interface AdjustStockDto {
  variantId: string;
  warehouseId: string;
  quantity: number;
  type: 'ADD' | 'SUBTRACT' | 'SET';
  reason: string;
}

export interface MovementFilters {
  page?: number;
  pageSize?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  warehouseId?: string;
  variantId?: string;
  search?: string;
}

export interface EnrichedMovement extends InventoryMovement {
  variantSku: string;
  productName: string;
  warehouseName?: string;
  branchName?: string;
  referenceType?: string;
  reason?: string;
}

export interface VariantStockSummary {
  variantId: string;
  availableQuantity: number;
  physicalQuantity: number;
  reservedQuantity: number;
}

export const inventoryApi = {
  getStockLevels: (filters?: StockFilters) =>
    get<PagedResponse<EnrichedStockLevel>>('/inventory/stock', { params: cleanParams(filters ?? {}) }),

  getStockSummary: (variantIds: string[]) =>
    get<VariantStockSummary[]>('/inventory/stock/summary', {
      params: { variantIds: variantIds.join(',') },
    }),

  getStockByVariant: (variantId: string) =>
    get<EnrichedStockLevel[]>(`/inventory/stock/variant/${variantId}`),

  adjustStock: (dto: AdjustStockDto) =>
    post<EnrichedStockLevel>('/inventory/stock/adjust', dto),

  getMovements: (variantId: string, warehouseId: string) =>
    get<EnrichedMovement[]>('/inventory/movements', { params: { variantId, warehouseId } }),

  getAllMovements: (filters?: MovementFilters) =>
    get<PagedResponse<EnrichedMovement>>('/inventory/movements/all', { params: cleanParams(filters ?? {}) }),

  getMovementDetail: (id: string) =>
    get<EnrichedMovement>(`/inventory/movements/${id}`),

  submitStockAudit: (dto: { warehouseId: string; items: { variantId: string; batchId?: string; countedQuantity: number }[] }) =>
    post<{ success: boolean; adjustmentsMade: number }>('/inventory/audit', dto),
};
