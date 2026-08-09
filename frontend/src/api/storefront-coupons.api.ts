import { post } from './client';

export interface CouponValidationResult {
  valid: boolean;
  type?: 'COUPON' | 'GIFT_CARD';
  code?: string;
  giftCardId?: string;
  balance?: number;
  promotionId?: string;
  promotionName?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  discountAmount?: number;
  message: string;
}

export const storefrontCouponsApi = {
  validate: (code: string, cartTotal: number) =>
    post<CouponValidationResult>('/storefront/validate-coupon', { code, cartTotal }),
};
