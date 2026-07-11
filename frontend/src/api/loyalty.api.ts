import { get, post } from './client';

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerAmount: number;
  amountUnit: number;
  redeemValuePerPoint: number;
}

export interface LoyaltyAccount {
  id: string;
  customerId: string;
  points: number;
  tier: string;
  createdAt: string;
  updatedAt: string;
}

export const loyaltyApi = {
  getSettings: () =>
    get<LoyaltySettings>('/loyalty/settings'),

  getAccount: (customerId: string) =>
    get<LoyaltyAccount>(`/loyalty/accounts/${customerId}`),

  ensureAccount: (customerId: string) =>
    post<LoyaltyAccount>(`/loyalty/accounts/${customerId}/ensure`, {}),

  redeem: (customerId: string, points: number, reason?: string) =>
    post<LoyaltyAccount>('/loyalty/redeem', { customerId, points, reason }),

  adjust: (customerId: string, points: number, tier?: string) =>
    post<LoyaltyAccount>('/loyalty/adjust', { customerId, points, tier }),
};
