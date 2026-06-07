import { get, post } from './client';
import type { CashRegister, ProductVariant } from '@/types';

export interface OpenSessionDto {
  cashRegisterId: string;
  openingAmount: number;
}

export interface CloseSessionDto {
  closingAmount: number;
  notes?: string;
}

export interface POSCalculateDto {
  lines: { variantId: string; quantity: number; discountPct?: number }[];
  cartDiscountPct?: number;
}

export interface POSCalculateResponse {
  subtotal: number;
  lineDiscountsTotal: number;
  cartDiscountTotal: number;
  grandTotal: number;
  lines: {
    variantId: string;
    originalPrice: number;
    finalPrice: number;
  }[];
}

export const posApi = {
  // Session Management
  getMyRegister: () => get<CashRegister | null>('/pos/session/current'),
  
  getAvailableRegisters: (branchId: string) => 
    get<CashRegister[]>('/pos/registers', { params: { branchId } }),

  openSession: (dto: OpenSessionDto) =>
    post<CashRegister>('/pos/session/open', dto),

  closeSession: (dto: CloseSessionDto) =>
    post<{ success: boolean }>('/pos/session/close', dto),

  // Scanner / Product Lookup
  searchProduct: (query: string) =>
    get<ProductVariant[]>('/pos/catalog/search', { params: { q: query } }),

  // Delegate complex promotion calculations to backend
  calculateCart: (dto: POSCalculateDto) =>
    post<POSCalculateResponse>('/pos/cart/calculate', dto),
};
