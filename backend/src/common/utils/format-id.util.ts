/**
 * Canonical display-ID utilities — shared between backend services and notifications.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEGACY_PREFIXED_NUM = /^[A-Z]{1,3}-\d+$/i;

export function stripDisplayPrefix(id: string): string {
  return id.replace(/^[A-Z]{1,3}-/i, '');
}

export function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export function isQuotationStatus(status?: string | null): boolean {
  return status === 'QUOTATION' || status === 'QUOTE';
}

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
