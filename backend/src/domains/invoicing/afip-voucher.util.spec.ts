import { describe, it, expect } from '@jest/globals';
import { resolveAfipVoucherParams, splitAmountsForAfip } from './afip-voucher.util';

describe('afip-voucher.util', () => {
  it('resolves Factura A for CUIT', () => {
    const params = resolveAfipVoucherParams('30-71234567-9', 'BUSINESS');
    expect(params.invoiceType).toBe(1);
    expect(params.documentType).toBe(80);
    expect(params.invoiceLabel).toBe('FA_A');
  });

  it('resolves Factura B for DNI', () => {
    const params = resolveAfipVoucherParams('12345678', 'INDIVIDUAL');
    expect(params.invoiceType).toBe(6);
    expect(params.documentType).toBe(96);
    expect(params.invoiceLabel).toBe('FA_B');
  });

  it('resolves consumidor final when tax id missing', () => {
    const params = resolveAfipVoucherParams(null, 'INDIVIDUAL');
    expect(params.documentType).toBe(99);
    expect(params.documentNumber).toBe(0);
  });

  it('splits IVA amounts from gross total', () => {
    const { netAmount, vatAmount, totalAmount } = splitAmountsForAfip(121, 0.21);
    expect(totalAmount).toBe(121);
    expect(netAmount).toBe(100);
    expect(vatAmount).toBe(21);
  });
});
