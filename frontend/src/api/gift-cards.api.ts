import { get, post } from './client';
import { cleanParams } from './requestUtils';

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initialBalance: number;
  expiresAt?: string | null;
  isActive: boolean;
  issuedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueGiftCardDto {
  amount: number;
  code?: string;
  expiresAt?: string;
  issuedTo?: string;
}

export const giftCardsApi = {
  getAll: (search?: string) =>
    get<GiftCard[]>('/gift-cards', { params: cleanParams({ search }) }),

  getBalance: (code: string) =>
    get<{ code: string; balance: number; expiresAt?: string | null; isActive: boolean }>(
      `/gift-cards/${encodeURIComponent(code)}/balance`,
    ),

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
