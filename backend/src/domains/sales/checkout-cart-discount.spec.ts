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

  it('calculates PERCENTAGE discount correctly', () => {
    const result = applyManualCartDiscount({
      merchandiseTotal: 10000,
      globalDiscountType: 'PERCENTAGE',
      globalDiscountValue: 15,
    });
    expect(result.manualCartDiscount).toBe(1500);
    expect(result.pricedTotal).toBe(8500);
    expect(result.effectiveDiscountPct).toBe(15);
  });

  it('calculates FIXED amount discount correctly', () => {
    const result = applyManualCartDiscount({
      merchandiseTotal: 10000,
      globalDiscountType: 'FIXED',
      globalDiscountValue: 2000,
    });
    expect(result.manualCartDiscount).toBe(2000);
    expect(result.pricedTotal).toBe(8000);
    expect(result.effectiveDiscountPct).toBe(20);
  });

  it('caps FIXED amount discount to merchandise total', () => {
    const result = applyManualCartDiscount({
      merchandiseTotal: 5000,
      globalDiscountType: 'FIXED',
      globalDiscountValue: 8000,
    });
    expect(result.manualCartDiscount).toBe(5000);
    expect(result.pricedTotal).toBe(0);
  });

  it('allows exceeding maxDiscountPct when supervisor override is true', () => {
    const result = applyManualCartDiscount({
      merchandiseTotal: 10000,
      globalDiscountType: 'PERCENTAGE',
      globalDiscountValue: 50,
      maxDiscountPct: 20,
      hasSupervisorOverride: true,
    });
    expect(result.manualCartDiscount).toBe(5000);
    expect(result.pricedTotal).toBe(5000);
  });

  it('allows discount when allowManualDiscount is false if supervisor override is true', () => {
    const result = applyManualCartDiscount({
      merchandiseTotal: 10000,
      globalDiscountType: 'PERCENTAGE',
      globalDiscountValue: 10,
      allowManualDiscount: false,
      hasSupervisorOverride: true,
    });
    expect(result.manualCartDiscount).toBe(1000);
    expect(result.pricedTotal).toBe(9000);
  });
});
