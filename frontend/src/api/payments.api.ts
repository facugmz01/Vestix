import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { PaymentRecord, PaymentMethodType, PagedResponse } from '@/types';

export interface PaymentsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface ProcessPaymentDto {
  referenceId: string; // Sale or Invoice ID
  amount: number;
  lines: {
    method: PaymentMethodType;
    amount: number;
    reference?: string;
  }[];
}

export const paymentsApi = {
  getPayments: (filters?: PaymentsFilters) =>
    get<PagedResponse<PaymentRecord>>('/finance/payments', { params: cleanParams(filters ?? {}) }),

  getPayment: (id: string) =>
    get<PaymentRecord>(`/finance/payments/${id}`),

  processPayment: (dto: ProcessPaymentDto) =>
    post<PaymentRecord>('/finance/payments/process', dto),
};
