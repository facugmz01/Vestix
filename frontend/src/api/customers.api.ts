import { get, post, patch, del } from './client';
import { cleanParams } from './requestUtils';
import type { Customer, PagedResponse } from '@/types';

export interface CustomerFilters {
  search?:   string;
  type?:     'INDIVIDUAL' | 'BUSINESS';
  onHold?:   boolean;
  page?:     number;
  pageSize?: number;
}

export type CreateCustomerDto = Omit<Customer, 'id' | 'createdAt' | 'credit'> & {
  initialCreditLimit?: number;
};
export type UpdateCustomerDto = Partial<CreateCustomerDto>;

export const customersApi = {
  getCustomers: (filters?: CustomerFilters) =>
    get<PagedResponse<Customer>>('/customers', { params: cleanParams(filters ?? {}) }),

  getCustomer: (id: string) =>
    get<Customer>(`/customers/${id}`),

  createCustomer: (dto: CreateCustomerDto) =>
    post<Customer>('/customers', dto),

  updateCustomer: (id: string, dto: UpdateCustomerDto) =>
    patch<Customer>(`/customers/${id}`, dto),

  deleteCustomer: (id: string) =>
    del(`/customers/${id}`),

  updateCreditLimit: (id: string, newLimit: number) =>
    post<Customer['credit']>(`/customers/${id}/credit-limit`, { newLimit }),

  repayCredit: (id: string, amount: number, paymentReceiptId: string) =>
    post<Customer['credit']>(`/customers/${id}/repay`, { amount, paymentReceiptId }),

  getHistory: (id: string) =>
    get<any[]>(`/customers/${id}/history`), // Should be typed with Order summary
};
