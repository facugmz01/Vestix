export type ManualCartDiscountInput = {
  merchandiseTotal: number;
  cartDiscountTotal?: number;
  allowManualDiscount?: boolean;
  maxDiscountPct?: number | null;
};

export type ManualCartDiscountResult = {
  manualCartDiscount: number;
  pricedTotal: number;
};

/**
 * Applies a client-sent manual cart-level discount on top of the
 * server merchandise total (which already includes line + promo discounts).
 */
export function applyManualCartDiscount(input: ManualCartDiscountInput): ManualCartDiscountResult {
  const merchandiseTotal = input.merchandiseTotal;
  let manualCartDiscount = Math.round(Math.max(0, input.cartDiscountTotal ?? 0) * 100) / 100;

  if (manualCartDiscount > 0) {
    if (input.allowManualDiscount === false) {
      throw new Error('MANUAL_DISCOUNT_DISABLED');
    }
    if (manualCartDiscount > merchandiseTotal + 0.01) {
      throw new Error('CART_DISCOUNT_EXCEEDS_TOTAL');
    }
    const discountPct = merchandiseTotal > 0
      ? (manualCartDiscount / merchandiseTotal) * 100
      : 0;
    if (input.maxDiscountPct != null && discountPct > input.maxDiscountPct + 0.01) {
      throw new Error('CART_DISCOUNT_EXCEEDS_MAX_PCT');
    }
  }

  const pricedTotal = Math.round((merchandiseTotal - manualCartDiscount) * 100) / 100;
  return { manualCartDiscount, pricedTotal };
}
