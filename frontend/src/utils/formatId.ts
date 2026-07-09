/**
 * Canonical display-ID utilities for Vestix ERP.
 * Full UUIDs are stored in the DB; the UI shows short, prefixed forms consistently.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_PREFIXED_NUM = /^[A-Z]{1,3}-\d+$/i;

/** Strip known display prefixes (V-, P-, OC-, etc.) from user input or stored refs. */
export function stripDisplayPrefix(id: string): string {
  return id.replace(/^[A-Z]{1,3}-/i, '');
}

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function isQuotationStatus(status?: string | null): boolean {
  return status === 'QUOTATION' || status === 'QUOTE';
}

/**
 * Short segment of a UUID or legacy ID (e.g. A1B2C3D4 or V-0001).
 * Does not add entity-specific prefixes.
 */
export function formatShortId(id: string | null | undefined): string {
  if (!id) return '—';
  const trimmed = id.trim();
  if (LEGACY_PREFIXED_NUM.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  const cleaned = stripDisplayPrefix(trimmed);
  if (isUuid(cleaned)) {
    return cleaned.split('-')[0].toUpperCase();
  }
  if (cleaned.includes('-') && /^[0-9a-f]+$/i.test(cleaned.split('-')[0] ?? '')) {
    return cleaned.split('-')[0].toUpperCase();
  }
  return cleaned.toUpperCase();
}

/** Sale / order display ID: V-XXXXXXXX or P-XXXXXXXX for quotations. */
export function formatSaleId(id: string | null | undefined, status?: string | null): string {
  if (!id) return '—';
  const trimmed = id.trim();
  if (LEGACY_PREFIXED_NUM.test(trimmed)) {
    const normalized = trimmed.toUpperCase();
    if (isQuotationStatus(status) && normalized.startsWith('V-')) {
      return normalized.replace(/^V-/, 'P-');
    }
    if (!isQuotationStatus(status) && normalized.startsWith('P-')) {
      return normalized.replace(/^P-/, 'V-');
    }
    return normalized;
  }
  const prefix = isQuotationStatus(status) ? 'P-' : 'V-';
  return `${prefix}${formatShortId(id)}`;
}

/** Entity ID with a fixed prefix (OC-, TRF-, etc.). */
export function formatEntityId(id: string | null | undefined, prefix: string): string {
  if (!id) return '—';
  const trimmed = id.trim();
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`^${escaped}`, 'i').test(trimmed)) {
    const body = trimmed.slice(prefix.length);
    return `${prefix}${formatShortId(body)}`;
  }
  return `${prefix}${formatShortId(id)}`;
}

const SALE_MOVEMENT_TYPES = new Set(['SALE', 'SALE_EXIT', 'CONSUME_RESERVATION']);
const PO_MOVEMENT_TYPES = new Set(['GOODS_RECEIPT']);

/** Format stock-ledger reference IDs based on movement context. */
export function formatMovementReferenceId(
  referenceId: string | null | undefined,
  movementType?: string,
): string {
  if (!referenceId) return '—';
  const trimmed = referenceId.trim();

  if (/^TRF-/i.test(trimmed)) {
    return formatEntityId(trimmed.replace(/^TRF-/i, ''), 'TRF-');
  }
  if (/^ADJ-/i.test(trimmed)) {
    return trimmed;
  }
  if (LEGACY_PREFIXED_NUM.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (movementType && SALE_MOVEMENT_TYPES.has(movementType)) {
    return formatSaleId(trimmed);
  }
  if (movementType && PO_MOVEMENT_TYPES.has(movementType)) {
    return formatEntityId(trimmed, 'OC-');
  }
  return formatShortId(trimmed);
}

/** Format payment / account reference that may point to a sale or invoice UUID. */
export function formatPaymentReferenceId(referenceId: string | null | undefined): string {
  if (!referenceId) return '—';
  const trimmed = referenceId.trim();
  if (LEGACY_PREFIXED_NUM.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (isUuid(trimmed) || isUuid(stripDisplayPrefix(trimmed))) {
    return formatSaleId(trimmed);
  }
  return formatShortId(trimmed);
}
