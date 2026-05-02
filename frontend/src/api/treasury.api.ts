import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { CashShift, TreasuryMovement, PagedResponse } from '@/types';

export interface TreasuryFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  branchId?: string;
}

export const treasuryApi = {
  getShifts: (filters?: TreasuryFilters) =>
    get<PagedResponse<CashShift>>('/finance/treasury/shifts', { params: cleanParams(filters ?? {}) }),

  getShift: (id: string) =>
    get<CashShift>(`/finance/treasury/shifts/${id}`),

  getShiftMovements: (id: string) =>
    get<TreasuryMovement[]>(`/finance/treasury/shifts/${id}/movements`),

  closeShift: (id: string, closingAmount: number) =>
    post<CashShift>(`/finance/treasury/shifts/${id}/close`, { closingAmount }),

  addManualMovement: (shiftId: string, payload: { type: 'INCOME'|'EXPENSE', amount: number, concept: string }) =>
    post<TreasuryMovement>(`/finance/treasury/shifts/${shiftId}/movements`, payload),
};
