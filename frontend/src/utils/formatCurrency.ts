/**
 * Shared currency formatting utility.
 * Replaces the per-component `fmtCurrency` inline functions
 * that were duplicated across 40+ files.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, maximumFractionDigits?: number): Intl.NumberFormat {
  const key = `${currency}:${maximumFractionDigits ?? 'default'}`;
  if (!formatterCache.has(key)) {
    const opts: Intl.NumberFormatOptions = { style: 'currency', currency };
    if (maximumFractionDigits !== undefined) {
      opts.maximumFractionDigits = maximumFractionDigits;
    }
    formatterCache.set(key, new Intl.NumberFormat('es-AR', opts));
  }
  return formatterCache.get(key)!;
}

/**
 * Format a number as Argentine-locale currency.
 * @param value  Numeric amount
 * @param currency  ISO 4217 currency code (default: 'ARS')
 * @param maximumFractionDigits  Override decimal places (e.g. 0 for compact display)
 */
export function formatCurrency(
  value: number,
  currency = 'ARS',
  maximumFractionDigits?: number,
): string {
  return getFormatter(currency, maximumFractionDigits).format(value);
}
