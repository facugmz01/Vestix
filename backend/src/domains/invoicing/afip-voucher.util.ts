/**
 * AFIP WSFE voucher type and document resolution for Argentine electronic invoicing.
 */

export type AfipInvoiceLabel = 'FA_A' | 'FA_B' | 'FA_C';
export type AfipCreditNoteLabel = 'NC_A' | 'NC_B' | 'NC_C';
export type AfipDebitNoteLabel = 'ND_A' | 'ND_B' | 'ND_C';

export type CustomerTaxCondition =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL';

export interface AfipVoucherParams {
  invoiceType: number;
  documentType: number;
  documentNumber: number;
  ivaRate: number;
  ivaId: number;
  condicionIvaReceptorId: number;
  invoiceLabel: AfipInvoiceLabel;
  /** True when the comprobante does not discriminate IVA (Factura C). */
  noIvaDiscrimination: boolean;
}

export interface AfipLineAmount {
  lineTotal: number;
  vatRate?: number;
}

export interface AfipVatBreakdown {
  ivaId: number;
  vatRate: number;
  netAmount: number;
  vatAmount: number;
}

export interface AfipSplitResult {
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  vatBreakdown: AfipVatBreakdown[];
}

const CUIT_REGEX = /^\d{11}$/;

const MONOTRIBUTO_CONDITIONS = new Set([
  'MONOTRIBUTO',
  'RESPONSABLE_MONOTRIBUTO',
]);

const EXENTO_CONDITIONS = new Set([
  'EXENTO',
  'IVA_EXENTO',
  'SUJETO_EXENTO',
]);

function normalizeTaxId(taxId?: string | null): string {
  return (taxId || '').replace(/\D/g, '');
}

function normalizeTaxCondition(
  taxCondition?: string | null,
): CustomerTaxCondition | null {
  if (!taxCondition) return null;
  const upper = taxCondition.trim().toUpperCase();
  if (MONOTRIBUTO_CONDITIONS.has(upper)) return 'MONOTRIBUTO';
  if (EXENTO_CONDITIONS.has(upper)) return 'EXENTO';
  if (upper === 'RESPONSABLE_INSCRIPTO' || upper === 'IVA_RESPONSABLE_INSCRIPTO') {
    return 'RESPONSABLE_INSCRIPTO';
  }
  if (upper === 'CONSUMIDOR_FINAL') return 'CONSUMIDOR_FINAL';
  return null;
}

function buildFacturaCParams(
  taxId: string,
  taxCondition: 'MONOTRIBUTO' | 'EXENTO',
): AfipVoucherParams {
  const normalized = normalizeTaxId(taxId);
  const hasCuit = CUIT_REGEX.test(normalized);
  const hasDni = normalized.length >= 7 && normalized.length <= 8;

  return {
    invoiceType: 11,
    documentType: hasCuit ? 80 : hasDni ? 96 : 99,
    documentNumber: hasCuit || hasDni ? parseInt(normalized, 10) : 0,
    ivaRate: 0,
    ivaId: 3,
    condicionIvaReceptorId: taxCondition === 'EXENTO' ? 4 : 6,
    invoiceLabel: 'FA_C',
    noIvaDiscrimination: true,
  };
}

/**
 * Maps a decimal VAT rate (0.21) to the AFIP WSFE alícuota Id.
 */
export function mapVatRateToAfipIvaId(vatRate: number): number {
  const pct = Math.round(vatRate * 1000) / 10;
  if (pct === 0) return 3;
  if (pct === 10.5) return 4;
  if (pct === 21) return 5;
  if (pct === 27) return 6;
  return 5;
}

function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolves AFIP comprobante type from customer tax ID and business rules.
 * - CUIT (11 digits) + RI → Factura A (CbteTipo 1) with DocTipo 80
 * - Monotributo / Exento → Factura C (CbteTipo 11)
 * - DNI (7-8 digits) → Factura B (CbteTipo 6) with DocTipo 96
 * - Missing/invalid → Factura B consumidor final (DocTipo 99, DocNro 0)
 */
export function resolveAfipVoucherParams(
  taxId?: string | null,
  customerType?: string | null,
  taxCondition?: string | null,
): AfipVoucherParams {
  const normalized = normalizeTaxId(taxId);
  const condition = normalizeTaxCondition(taxCondition);

  if (condition === 'MONOTRIBUTO' || condition === 'EXENTO') {
    return buildFacturaCParams(normalized, condition);
  }

  if (CUIT_REGEX.test(normalized)) {
    return {
      invoiceType: 1,
      documentType: 80,
      documentNumber: parseInt(normalized, 10),
      ivaRate: 0.21,
      ivaId: 5,
      condicionIvaReceptorId: 1,
      invoiceLabel: 'FA_A',
      noIvaDiscrimination: false,
    };
  }

  if (normalized.length >= 7 && normalized.length <= 8) {
    return {
      invoiceType: 6,
      documentType: 96,
      documentNumber: parseInt(normalized, 10),
      ivaRate: 0.21,
      ivaId: 5,
      condicionIvaReceptorId: 5,
      invoiceLabel: 'FA_B',
      noIvaDiscrimination: false,
    };
  }

  if (customerType === 'BUSINESS' && normalized.length > 0) {
    return {
      invoiceType: 6,
      documentType: 96,
      documentNumber: parseInt(normalized.slice(0, 8), 10) || 0,
      ivaRate: 0.21,
      ivaId: 5,
      condicionIvaReceptorId: 5,
      invoiceLabel: 'FA_B',
      noIvaDiscrimination: false,
    };
  }

  return {
    invoiceType: 6,
    documentType: 99,
    documentNumber: 0,
    ivaRate: 0.21,
    ivaId: 5,
    condicionIvaReceptorId: 5,
    invoiceLabel: 'FA_B',
    noIvaDiscrimination: false,
  };
}

export function resolveCreditNoteParams(
  voucherParams: AfipVoucherParams,
): { label: AfipCreditNoteLabel; cbteTipo: number } {
  if (voucherParams.invoiceLabel === 'FA_A') {
    return { label: 'NC_A', cbteTipo: 3 };
  }
  if (voucherParams.invoiceLabel === 'FA_C') {
    return { label: 'NC_C', cbteTipo: 13 };
  }
  return { label: 'NC_B', cbteTipo: 8 };
}

export function resolveDebitNoteParams(
  voucherParams: AfipVoucherParams,
): { label: AfipDebitNoteLabel; cbteTipo: number } {
  if (voucherParams.invoiceLabel === 'FA_A') {
    return { label: 'ND_A', cbteTipo: 2 };
  }
  if (voucherParams.invoiceLabel === 'FA_C') {
    return { label: 'ND_C', cbteTipo: 12 };
  }
  return { label: 'ND_B', cbteTipo: 7 };
}

export function splitAmountsForAfip(totalAmount: number, ivaRate: number) {
  const total = roundAmount(totalAmount);
  if (ivaRate === 0) {
    return { netAmount: total, vatAmount: 0, totalAmount: total };
  }
  const netAmount = roundAmount(total / (1 + ivaRate));
  const vatAmount = roundAmount(total - netAmount);
  return { netAmount, vatAmount, totalAmount: total };
}

/**
 * Splits line-level gross amounts into net/VAT buckets grouped by alícuota.
 */
export function splitAmountsForMultiVat(
  lines: AfipLineAmount[],
  defaultVatRate = 0.21,
): AfipSplitResult {
  const buckets = new Map<number, AfipVatBreakdown>();

  for (const line of lines) {
    const rate = line.vatRate ?? defaultVatRate;
    const split = splitAmountsForAfip(line.lineTotal, rate);
    const ivaId = mapVatRateToAfipIvaId(rate);
    const existing = buckets.get(ivaId);

    if (existing) {
      existing.netAmount = roundAmount(existing.netAmount + split.netAmount);
      existing.vatAmount = roundAmount(existing.vatAmount + split.vatAmount);
    } else {
      buckets.set(ivaId, {
        ivaId,
        vatRate: rate,
        netAmount: split.netAmount,
        vatAmount: split.vatAmount,
      });
    }
  }

  const vatBreakdown = Array.from(buckets.values()).sort((a, b) => a.ivaId - b.ivaId);
  const netAmount = roundAmount(vatBreakdown.reduce((sum, row) => sum + row.netAmount, 0));
  const vatAmount = roundAmount(vatBreakdown.reduce((sum, row) => sum + row.vatAmount, 0));
  const totalAmount = roundAmount(netAmount + vatAmount);

  return { netAmount, vatAmount, totalAmount, vatBreakdown };
}

/**
 * Reads vatRate from variant/product attributes JSON when present.
 * Accepts vatRate as decimal (0.21) or vatRatePct as percentage (21).
 */
export function extractVatRateFromAttributes(
  attributes: unknown,
  defaultVatRate: number,
): number {
  if (!attributes || typeof attributes !== 'object') {
    return defaultVatRate;
  }

  const record = attributes as Record<string, unknown>;
  if (typeof record.vatRate === 'number' && record.vatRate >= 0) {
    return record.vatRate <= 1 ? record.vatRate : record.vatRate / 100;
  }
  if (typeof record.vatRatePct === 'number' && record.vatRatePct >= 0) {
    return record.vatRatePct / 100;
  }

  return defaultVatRate;
}

export function buildAfipAmounts(
  split: AfipSplitResult,
  noIvaDiscrimination: boolean,
): AfipSplitResult {
  if (!noIvaDiscrimination) {
    return split;
  }

  return {
    netAmount: split.totalAmount,
    vatAmount: 0,
    totalAmount: split.totalAmount,
    vatBreakdown: [],
  };
}

const AFIP_CBTE_TYPE: Record<string, number> = {
  FACTURA_A: 1,
  FA_A: 1,
  FACTURA_B: 6,
  FA_B: 6,
  FACTURA_C: 11,
  FA_C: 11,
  NOTA_CREDITO_A: 3,
  NC_A: 3,
  NOTA_CREDITO_B: 8,
  NC_B: 8,
  NOTA_CREDITO_C: 13,
  NC_C: 13,
  NOTA_DEBITO_A: 2,
  ND_A: 2,
  NOTA_DEBITO_B: 7,
  ND_B: 7,
  NOTA_DEBITO_C: 12,
  ND_C: 12,
};

function mapCustomerDocType(docType: string): number {
  const asNum = parseInt(docType, 10);
  if (!Number.isNaN(asNum)) return asNum;
  if (docType === 'CUIT') return 80;
  if (docType === 'CUIL') return 86;
  if (docType === 'DNI') return 96;
  return 99;
}

/**
 * Builds AFIP WSFE params from a persisted invoice draft (manual issue flow).
 */
export function resolveAfipParamsFromInvoice(invoice: {
  type: string;
  customerDocumentType: string;
  customerDocumentNumber: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
}) {
  const invoiceType = AFIP_CBTE_TYPE[invoice.type] ?? 6;
  const documentType = mapCustomerDocType(invoice.customerDocumentType);
  const documentNumber =
    parseInt(invoice.customerDocumentNumber.replace(/\D/g, ''), 10) || 0;
  const noIvaDiscrimination = invoiceType === 11;

  return {
    invoiceType,
    documentType,
    documentNumber,
    netAmount: invoice.netAmount,
    vatAmount: invoice.vatAmount,
    totalAmount: invoice.totalAmount,
    ivaId: noIvaDiscrimination ? 3 : 5,
    condicionIvaReceptorId: invoiceType === 1 ? 1 : invoiceType === 11 ? 6 : 5,
    noIvaDiscrimination,
    vatBreakdown: noIvaDiscrimination
      ? []
      : [{ ivaId: 5, vatRate: 0.21, netAmount: invoice.netAmount, vatAmount: invoice.vatAmount }],
  };
}
