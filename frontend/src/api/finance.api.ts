import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { CurrentAccount, CurrentAccountMovement, PagedResponse, PaymentMethodEntity } from '@/types';

export interface CurrentAccountFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  entityType?: 'CUSTOMER' | 'SUPPLIER';
}

export interface MovementFilters {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export const financeApi = {
  getPaymentMethods: () => get<PaymentMethodEntity[]>('/finance/payment-methods'),

  getCurrentAccounts: (filters?: CurrentAccountFilters) =>
    get<PagedResponse<CurrentAccount>>('/finance/current-accounts', { params: cleanParams(filters ?? {}) }),

  getCurrentAccount: (id: string) =>
    get<CurrentAccount>(`/finance/current-accounts/${id}`),

  getMovements: (accountId: string, filters?: MovementFilters) =>
    get<PagedResponse<CurrentAccountMovement>>(`/finance/current-accounts/${accountId}/movements`, { params: cleanParams(filters ?? {}) }),

  // Action endpoints for generating receipts/notes
  registerPaymentReceipt: (accountId: string, payload: { amount: number, referenceId: string, description: string }) =>
    post<CurrentAccountMovement>(`/finance/current-accounts/${accountId}/receipts`, payload),

  issueCreditNote: (accountId: string, payload: { amount: number, referenceId: string, description: string }) =>
    post<CurrentAccountMovement>(`/finance/current-accounts/${accountId}/credit-notes`, payload),

  issueDebitNote: (accountId: string, payload: { amount: number, referenceId: string, description: string, dueDate: string }) =>
    post<CurrentAccountMovement>(`/finance/current-accounts/${accountId}/debit-notes`, payload),

  sendOverdueStatements: () =>
    post<{ success: boolean; message: string }>('/finance/current-accounts/send-overdue'),

  sendManualStatement: (accountId: string, payload: { channel: 'EMAIL' | 'WHATSAPP'; recipient: string }) =>
    post<{ success: boolean; message: string }>(`/finance/current-accounts/${accountId}/send-statement`, payload),
};
