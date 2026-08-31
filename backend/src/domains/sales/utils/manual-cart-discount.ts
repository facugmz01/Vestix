export type ManualCartDiscountInput = {
  merchandiseTotal: number;
  cartDiscountTotal?: number;
  globalDiscountType?: 'PERCENTAGE' | 'FIXED';
  globalDiscountValue?: number;
  allowManualDiscount?: boolean;
  maxDiscountPct?: number | null;
  hasSupervisorOverride?: boolean;
};

export type ManualCartDiscountResult = {
  manualCartDiscount: number;
  pricedTotal: number;
  effectiveDiscountPct: number;
};

/**
 * Applies a client-sent manual cart-level discount on top of the
 * server merchandise total (which already includes line + promo discounts).
 */
export function applyManualCartDiscount(input: ManualCartDiscountInput): ManualCartDiscountResult {
  const merchandiseTotal = Math.max(0, input.merchandiseTotal);
  let manualCartDiscount = 0;

  if (input.globalDiscountType && input.globalDiscountValue !== undefined && input.globalDiscountValue > 0) {
    if (input.globalDiscountType === 'PERCENTAGE') {
      const pct = Math.min(100, Math.max(0, input.globalDiscountValue));
      manualCartDiscount = Math.round((merchandiseTotal * (pct / 100)) * 100) / 100;
    } else if (input.globalDiscountType === 'FIXED') {
      manualCartDiscount = Math.round(Math.min(merchandiseTotal, Math.max(0, input.globalDiscountValue)) * 100) / 100;
    }
  } else if (input.cartDiscountTotal !== undefined && input.cartDiscountTotal > 0) {
    manualCartDiscount = Math.round(Math.max(0, input.cartDiscountTotal) * 100) / 100;
  }

  if (manualCartDiscount > 0) {
    if (input.allowManualDiscount === false && !input.hasSupervisorOverride) {
      throw new Error('MANUAL_DISCOUNT_DISABLED');
    }
    if (manualCartDiscount > merchandiseTotal + 0.01) {
      throw new Error('CART_DISCOUNT_EXCEEDS_TOTAL');
    }
    const discountPct = merchandiseTotal > 0
      ? (manualCartDiscount / merchandiseTotal) * 100
      : 0;
    if (input.maxDiscountPct != null && discountPct > input.maxDiscountPct + 0.01 && !input.hasSupervisorOverride) {
      throw new Error('CART_DISCOUNT_EXCEEDS_MAX_PCT');
    }
  }

  const pricedTotal = Math.max(0, Math.round((merchandiseTotal - manualCartDiscount) * 100) / 100);
  const effectiveDiscountPct = merchandiseTotal > 0 ? (manualCartDiscount / merchandiseTotal) * 100 : 0;

  return { manualCartDiscount, pricedTotal, effectiveDiscountPct };
}

