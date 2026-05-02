import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { CashRegister, PagedResponse } from '@/types';

export interface CashRegisterFilters {
  search?: string;
  branchId?: string;
  status?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export type CreateCashRegisterDto = Omit<CashRegister, 'id' | 'createdAt' | 'branchName' | 'operatorName' | 'status' | 'currentOperatorId'>;
export type UpdateCashRegisterDto = Partial<CreateCashRegisterDto>;

export const cashRegistersApi = {
  getCashRegisters: (filters?: CashRegisterFilters) =>
    get<PagedResponse<CashRegister>>('/cash-registers', { params: cleanParams(filters ?? {}) }),

  getCashRegister: (id: string) =>
    get<CashRegister>(`/cash-registers/${id}`),

  createCashRegister: (dto: CreateCashRegisterDto) =>
    post<CashRegister>('/cash-registers', dto),

  updateCashRegister: (id: string, dto: UpdateCashRegisterDto) =>
    patch<CashRegister>(`/cash-registers/${id}`, dto),

  deleteCashRegister: (id: string) =>
    del(`/cash-registers/${id}`),
};
