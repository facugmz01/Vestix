import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { ElectronicInvoice, InvoiceType, PagedResponse } from '@/types';

export interface InvoicesFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface IssueInvoiceDto {
  saleOrderId: string;
  type: InvoiceType;
  receiverName: string;
  receiverDocType: 'CUIT' | 'CUIL' | 'DNI';
  receiverDocNumber: string;
  receiverIvaCondition: string;
  receiverAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
}

export const invoicesApi = {
  getInvoices: (filters?: InvoicesFilters) =>
    get<PagedResponse<ElectronicInvoice>>('/finance/invoices', { params: cleanParams(filters ?? {}) }),

  getInvoice: (id: string) =>
    get<ElectronicInvoice>(`/finance/invoices/${id}`),

  getBySaleOrder: (saleOrderId: string) =>
    get<ElectronicInvoice[]>(`/finance/invoices/by-sale/${saleOrderId}`),

  issueInvoice: (dto: IssueInvoiceDto) =>
    post<ElectronicInvoice>('/finance/invoices/issue', dto),

  retryInvoice: (id: string) =>
    post<ElectronicInvoice>(`/finance/invoices/${id}/retry`, {}),

  cancelInvoice: (id: string) =>
    post<ElectronicInvoice>(`/finance/invoices/${id}/cancel`, {}),
};
