import { suggestMercadoPagoPrice, MP_FEE_RATES, MP_INSTALLMENT_PLANS } from './mercadopago-pricing.util';

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

  it('calculates price absorbing 3 installments without interest (standard Mercado Pago)', () => {
    const withoutInstallments = suggestMercadoPagoPrice({
      costPrice: 10000,
      profitMarginPercent: 50,
      mpModality: 'POINT_CREDIT_INSTANT',
      installmentPlan: 'NONE',
    });

    const with3Installments = suggestMercadoPagoPrice({
      costPrice: 10000,
      profitMarginPercent: 50,
      mpModality: 'POINT_CREDIT_INSTANT',
      installmentPlan: 'INSTALLMENTS_3',
    });

    // Price with 3 installments must absorb the 8.99% financing fee (+ 21% IVA)
    expect(with3Installments.suggestedPrice).toBeGreaterThan(withoutInstallments.suggestedPrice);
    expect(with3Installments.installmentsCount).toBe(3);
    expect(with3Installments.installmentAmount).toBe(
      Math.round((with3Installments.suggestedPrice / 3) * 100) / 100
    );
    expect(with3Installments.mpFinancingFeeAmount).toBeGreaterThan(0);
    expect(with3Installments.fundamentationText).toContain('3 cuotas fijas');

    // Liquidation must still be exact
    const netRetained =
      with3Installments.suggestedPrice -
      with3Installments.mpDeductionTotal -
      with3Installments.iibbDeduction -
      with3Installments.productIvaAmount;
    expect(Math.abs(netRetained - (with3Installments.landedCost + with3Installments.expectedNetProfit))).toBeLessThanOrEqual(2);
  });

  it('calculates price for Cuota Simple 3 and Cuota Simple 6', () => {
    const cs3 = suggestMercadoPagoPrice({
      costPrice: 12000,
      profitMarginPercent: 50,
      installmentPlan: 'CUOTA_SIMPLE_3',
    });

    const cs6 = suggestMercadoPagoPrice({
      costPrice: 12000,
      profitMarginPercent: 50,
      installmentPlan: 'CUOTA_SIMPLE_6',
    });

    expect(cs3.installmentsCount).toBe(3);
    expect(cs6.installmentsCount).toBe(6);
    expect(cs6.suggestedPrice).toBeGreaterThan(cs3.suggestedPrice);
    expect(cs3.fundamentationText).toContain('Cuota Simple 3');
    expect(cs6.fundamentationText).toContain('Cuota Simple 6');
  });

  it('supports custom installment plans', () => {
    const custom = suggestMercadoPagoPrice({
      costPrice: 15000,
      profitMarginPercent: 40,
      installmentPlan: 'CUSTOM_INSTALLMENTS',
      customInstallmentsCount: 4,
      customInstallmentFeePercent: 12.0,
    });

    expect(custom.installmentsCount).toBe(4);
    expect(custom.fundamentationText).toContain('4 cuotas sin interés (+12%)');
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
