import { suggestMercadoPagoPrice, MP_FEE_RATES } from './mercadopago-pricing.util';

describe('Mercado Pago Pricing Utility', () => {
  it('calculates suggested price absorbing MP Point fees and guarantees target profit', () => {
    const result = suggestMercadoPagoPrice({
      costPrice: 10000,
      shippingAllocated: 500,
      otherExpenses: 200,
      profitMarginPercent: 50,
      mpModality: 'POINT_CREDIT_INSTANT',
      iibbPercent: 3.5,
      productIvaPercent: 21,
    });

    expect(result.landedCost).toBe(10700);
    expect(result.expectedNetProfit).toBe(5350);
    expect(result.suggestedPrice).toBeGreaterThan(result.cashPrice);
    expect(result.modifierPercentage).toBeGreaterThan(50);
    expect(result.fundamentationText).toContain('DEMOSTRACIÓN DE LA LIQUIDACIÓN REAL');
    expect(result.breakdown.length).toBe(5);

    // Verify mathematical liquidation:
    // FinalPrice - MPDeduction - IIBBDeduction - IVADeduction = LandedCost + TargetProfit
    const netRetained = result.suggestedPrice - result.mpDeductionTotal - result.iibbDeduction - result.productIvaAmount;
    expect(Math.abs(netRetained - (result.landedCost + result.expectedNetProfit))).toBeLessThanOrEqual(2);
  });

  it('handles debit modality with lower fee correctly', () => {
    const debitResult = suggestMercadoPagoPrice({
      costPrice: 10000,
      profitMarginPercent: 50,
      mpModality: 'POINT_DEBIT',
    });

    const creditResult = suggestMercadoPagoPrice({
      costPrice: 10000,
      profitMarginPercent: 50,
      mpModality: 'POINT_CREDIT_INSTANT',
    });

    expect(debitResult.suggestedPrice).toBeLessThan(creditResult.suggestedPrice);
    expect(debitResult.mpDeductionTotal).toBeLessThan(creditResult.mpDeductionTotal);
  });

  it('supports custom fee percentage', () => {
    const result = suggestMercadoPagoPrice({
      costPrice: 20000,
      profitMarginPercent: 40,
      mpModality: 'CUSTOM',
      customMpFeePercent: 5.0,
    });

    expect(result.suggestedPrice).toBeGreaterThan(20000);
    expect(result.fundamentationText).toContain('Personalizado (5%)');
  });

  it('throws an error if costPrice is non-positive', () => {
    expect(() =>
      suggestMercadoPagoPrice({
        costPrice: 0,
        profitMarginPercent: 50,
      }),
    ).toThrow('El costo del producto debe ser mayor a 0');
  });
});
