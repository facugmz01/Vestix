import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { Customer } from '@/types';

export interface GiftCardCustomerSummary {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initialBalance: number;
  expiresAt?: string | null;
  isActive: boolean;
  issuedTo?: string | null;
  customerId?: string | null;
  customer?: GiftCardCustomerSummary | null;
  fundingType?: 'INCOME' | 'EXPENSE' | null;
  fundingNotes?: string | null;
  accountId?: string | null;
  verificationToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface GiftCardVerification {
  valid: boolean;
  code: string;
  balance: number;
  initialBalance: number;
  expiresAt?: string | null;
  isActive: boolean;
  isExpired: boolean;
  recipient?: string | null;
  issuedAt: string;
  fundingType?: 'INCOME' | 'EXPENSE' | null;
}

export interface IssueGiftCardCustomerDto {
  type?: 'INDIVIDUAL' | 'BUSINESS';
  fullName: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

export interface IssueGiftCardDto {
  amount: number;
  code?: string;
  expiresAt?: string;
  issuedTo?: string;
  customerId?: string;
  newCustomer?: IssueGiftCardCustomerDto;
  fundingType: 'INCOME' | 'EXPENSE';
  accountId: string;
  fundingNotes?: string;
}

export const giftCardsApi = {
  getAll: (search?: string) =>
    get<GiftCard[]>('/gift-cards', { params: cleanParams({ search }) }),

  getBalance: (code: string) =>
    get<{ code: string; balance: number; expiresAt?: string | null; isActive: boolean }>(
      `/gift-cards/${encodeURIComponent(code)}/balance`,
    ),

  verify: (token: string) =>
    get<GiftCardVerification>(`/gift-cards/verify/${encodeURIComponent(token)}`),

  issue: (dto: IssueGiftCardDto) =>
    post<GiftCard>('/gift-cards/issue', dto),

  redeem: (code: string, amount: number) =>
    post<{ code: string; redeemedAmount: number; remainingBalance: number }>(
      '/gift-cards/redeem',
      { code, amount },
    ),

  deactivate: (code: string) =>
    post<GiftCard>(`/gift-cards/${encodeURIComponent(code)}/deactivate`, {}),
};

export function buildGiftCardVerifyUrl(token: string): string {
  return `${window.location.origin}/api/gift-cards/verify/${encodeURIComponent(token)}`;
}
