import { applyManualCartDiscount } from './utils/manual-cart-discount';

describe('applyManualCartDiscount', () => {
  it('applies 50% global discount so posGrandTotal 3500 matches', () => {
    const result = applyManualCartDiscount({
      merchandiseTotal: 7000,
      cartDiscountTotal: 3500,
    });
    expect(result.pricedTotal).toBe(3500);
    expect(result.manualCartDiscount).toBe(3500);
  });

  it('keeps full total when no cart discount is sent', () => {
    const result = applyManualCartDiscount({ merchandiseTotal: 7000 });
    expect(result.pricedTotal).toBe(7000);
    expect(result.manualCartDiscount).toBe(0);
  });

  it('rejects discount when manual discounts are disabled', () => {
    expect(() =>
      applyManualCartDiscount({
        merchandiseTotal: 7000,
        cartDiscountTotal: 100,
        allowManualDiscount: false,
      }),
    ).toThrow('MANUAL_DISCOUNT_DISABLED');
  });

  it('rejects discount above maxDiscountPct', () => {
    expect(() =>
      applyManualCartDiscount({
        merchandiseTotal: 7000,
        cartDiscountTotal: 3500,
        maxDiscountPct: 20,
      }),
    ).toThrow('CART_DISCOUNT_EXCEEDS_MAX_PCT');
  });

  it('rejects discount greater than merchandise total', () => {
    expect(() =>
      applyManualCartDiscount({
        merchandiseTotal: 1000,
        cartDiscountTotal: 1500,
      }),
    ).toThrow('CART_DISCOUNT_EXCEEDS_TOTAL');
  });
});
