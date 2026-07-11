import { describe, it, expect } from '@jest/globals';
import {
  resolveAfipVoucherParams,
  splitAmountsForAfip,
  splitAmountsForMultiVat,
  mapVatRateToAfipIvaId,
  resolveCreditNoteParams,
  resolveDebitNoteParams,
  extractVatRateFromAttributes,
  buildAfipAmounts,
  resolveAfipParamsFromInvoice,
} from './afip-voucher.util';

describe('afip-voucher.util', () => {
  it('resolves Factura A for CUIT with RI condition', () => {
    const params = resolveAfipVoucherParams('30-71234567-9', 'BUSINESS', 'RESPONSABLE_INSCRIPTO');
    expect(params.invoiceType).toBe(1);
    expect(params.documentType).toBe(80);
    expect(params.invoiceLabel).toBe('FA_A');
    expect(params.noIvaDiscrimination).toBe(false);
  });

  it('resolves Factura C for monotributo customer with CUIT', () => {
    const params = resolveAfipVoucherParams('30-71234567-9', 'BUSINESS', 'MONOTRIBUTO');
    expect(params.invoiceType).toBe(11);
    expect(params.documentType).toBe(80);
    expect(params.invoiceLabel).toBe('FA_C');
    expect(params.ivaRate).toBe(0);
    expect(params.condicionIvaReceptorId).toBe(6);
    expect(params.noIvaDiscrimination).toBe(true);
  });

  it('resolves Factura C for exento customer', () => {
    const params = resolveAfipVoucherParams('12345678', 'INDIVIDUAL', 'EXENTO');
    expect(params.invoiceType).toBe(11);
    expect(params.documentType).toBe(96);
    expect(params.invoiceLabel).toBe('FA_C');
    expect(params.condicionIvaReceptorId).toBe(4);
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

  it('splits zero-rate amounts without VAT', () => {
    const { netAmount, vatAmount, totalAmount } = splitAmountsForAfip(100, 0);
    expect(totalAmount).toBe(100);
    expect(netAmount).toBe(100);
    expect(vatAmount).toBe(0);
  });

  it('maps VAT rates to AFIP alícuota ids', () => {
    expect(mapVatRateToAfipIvaId(0)).toBe(3);
    expect(mapVatRateToAfipIvaId(0.105)).toBe(4);
    expect(mapVatRateToAfipIvaId(0.21)).toBe(5);
    expect(mapVatRateToAfipIvaId(0.27)).toBe(6);
  });

  it('splits multi-IVA line amounts into alícuota buckets', () => {
    const result = splitAmountsForMultiVat([
      { lineTotal: 121, vatRate: 0.21 },
      { lineTotal: 110.5, vatRate: 0.105 },
      { lineTotal: 127, vatRate: 0.27 },
      { lineTotal: 50, vatRate: 0 },
    ]);

    expect(result.totalAmount).toBe(408.5);
    expect(result.vatBreakdown).toHaveLength(4);
    expect(result.vatBreakdown.find(r => r.ivaId === 5)).toEqual(
      expect.objectContaining({ netAmount: 100, vatAmount: 21 }),
    );
    expect(result.vatBreakdown.find(r => r.ivaId === 4)).toEqual(
      expect.objectContaining({ netAmount: 100, vatAmount: 10.5 }),
    );
    expect(result.vatBreakdown.find(r => r.ivaId === 6)).toEqual(
      expect.objectContaining({ netAmount: 100, vatAmount: 27 }),
    );
    expect(result.vatBreakdown.find(r => r.ivaId === 3)).toEqual(
      expect.objectContaining({ netAmount: 50, vatAmount: 0 }),
    );
  });

  it('extracts vatRate from variant attributes', () => {
    expect(extractVatRateFromAttributes({ vatRate: 0.105 }, 0.21)).toBe(0.105);
    expect(extractVatRateFromAttributes({ vatRatePct: 27 }, 0.21)).toBe(0.27);
    expect(extractVatRateFromAttributes(null, 0.21)).toBe(0.21);
  });

  it('resolves credit and debit note types from voucher params', () => {
    const facturaA = resolveAfipVoucherParams('30123456789', 'BUSINESS', 'RESPONSABLE_INSCRIPTO');
    expect(resolveCreditNoteParams(facturaA)).toEqual({ label: 'NC_A', cbteTipo: 3 });
    expect(resolveDebitNoteParams(facturaA)).toEqual({ label: 'ND_A', cbteTipo: 2 });

    const facturaC = resolveAfipVoucherParams('30123456789', 'BUSINESS', 'MONOTRIBUTO');
    expect(resolveCreditNoteParams(facturaC)).toEqual({ label: 'NC_C', cbteTipo: 13 });
    expect(resolveDebitNoteParams(facturaC)).toEqual({ label: 'ND_C', cbteTipo: 12 });
  });

  it('builds non-discriminated amounts for Factura C', () => {
    const split = splitAmountsForMultiVat([{ lineTotal: 121, vatRate: 0.21 }]);
    const amounts = buildAfipAmounts(split, true);
    expect(amounts.netAmount).toBe(121);
    expect(amounts.vatAmount).toBe(0);
    expect(amounts.vatBreakdown).toEqual([]);
  });

  it('resolves AFIP params from a persisted manual invoice draft', () => {
    const params = resolveAfipParamsFromInvoice({
      type: 'FACTURA_A',
      customerDocumentType: 'CUIT',
      customerDocumentNumber: '30-71234567-9',
      netAmount: 100,
      vatAmount: 21,
      totalAmount: 121,
    });

    expect(params.invoiceType).toBe(1);
    expect(params.documentType).toBe(80);
    expect(params.documentNumber).toBe(30712345679);
    expect(params.netAmount).toBe(100);
    expect(params.noIvaDiscrimination).toBe(false);
  });
});
