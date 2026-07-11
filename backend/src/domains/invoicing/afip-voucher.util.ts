/**
 * AFIP WSFE voucher type and document resolution for Argentine electronic invoicing.
 */

export interface AfipVoucherParams {
  invoiceType: number;
  documentType: number;
  documentNumber: number;
  ivaRate: number;
  ivaId: number;
  condicionIvaReceptorId: number;
  invoiceLabel: 'FA_A' | 'FA_B' | 'FA_C';
}

const CUIT_REGEX = /^\d{11}$/;

function normalizeTaxId(taxId?: string | null): string {
  return (taxId || '').replace(/\D/g, '');
}

/**
 * Resolves AFIP comprobante type from customer tax ID and business rules.
 * - CUIT (11 digits) → Factura A (CbteTipo 1) with DocTipo 80
 * - DNI (7-8 digits) → Factura B (CbteTipo 6) with DocTipo 96
 * - Missing/invalid → Factura B consumidor final (DocTipo 99, DocNro 0)
 */
export function resolveAfipVoucherParams(
  taxId?: string | null,
  customerType?: string | null,
): AfipVoucherParams {
  const normalized = normalizeTaxId(taxId);

  if (CUIT_REGEX.test(normalized)) {
    return {
      invoiceType: 1,
      documentType: 80,
      documentNumber: parseInt(normalized, 10),
      ivaRate: 0.21,
      ivaId: 5,
      condicionIvaReceptorId: 1, // IVA Responsable Inscripto
      invoiceLabel: 'FA_A',
    };
  }

  if (normalized.length >= 7 && normalized.length <= 8) {
    return {
      invoiceType: 6,
      documentType: 96,
      documentNumber: parseInt(normalized, 10),
      ivaRate: 0.21,
      ivaId: 5,
      condicionIvaReceptorId: 5, // Consumidor Final
      invoiceLabel: 'FA_B',
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
  };
}

export function splitAmountsForAfip(totalAmount: number, ivaRate: number) {
  const total = Math.round(totalAmount * 100) / 100;
  const netAmount = Math.round((total / (1 + ivaRate)) * 100) / 100;
  const vatAmount = Math.round((total - netAmount) * 100) / 100;
  return { netAmount, vatAmount, totalAmount: total };
}
