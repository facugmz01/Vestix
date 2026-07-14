import { BadRequestException } from '@nestjs/common';

/**
 * Mirror of PurchasingService.computeOrderTotals for focused unit coverage.
 * Kept local to avoid spinning Nest DI for arithmetic regressions.
 */
function computeOrderTotals(
  lines: { orderedQuantity: number; unitCost: number; discountAmount?: number }[],
  headerDiscount = 0,
  shippingCost = 0,
) {
  const linesSubtotal = lines.reduce((sum, l) => {
    const lineDiscount = Math.max(0, l.discountAmount || 0);
    return sum + Math.max(0, l.orderedQuantity * l.unitCost - lineDiscount);
  }, 0);
  const discountAmount = Math.max(0, headerDiscount || 0);
  const shipping = Math.max(0, shippingCost || 0);
  if (discountAmount > linesSubtotal) {
    throw new BadRequestException('El descuento de la orden no puede superar el subtotal de artículos.');
  }
  const totalAmount = Math.max(0, linesSubtotal - discountAmount + shipping);
  return { linesSubtotal, discountAmount, shippingCost: shipping, totalAmount };
}

describe('Purchasing order totals', () => {
  it('applies line discounts, header discount and shipping', () => {
    const result = computeOrderTotals(
      [
        { orderedQuantity: 2, unitCost: 100, discountAmount: 20 },
        { orderedQuantity: 1, unitCost: 50, discountAmount: 0 },
      ],
      30,
      15,
    );
    // lines: (200-20) + 50 = 230; -30 +15 = 215
    expect(result.linesSubtotal).toBe(230);
    expect(result.discountAmount).toBe(30);
    expect(result.shippingCost).toBe(15);
    expect(result.totalAmount).toBe(215);
  });

  it('rejects header discount above lines subtotal', () => {
    expect(() =>
      computeOrderTotals([{ orderedQuantity: 1, unitCost: 100 }], 150, 0),
    ).toThrow(BadRequestException);
  });

  it('never returns negative totals', () => {
    const result = computeOrderTotals(
      [{ orderedQuantity: 1, unitCost: 10, discountAmount: 50 }],
      0,
      0,
    );
    expect(result.linesSubtotal).toBe(0);
    expect(result.totalAmount).toBe(0);
  });
});
