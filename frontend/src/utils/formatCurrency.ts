/**
 * Shared currency formatting utility.
 * Replaces the per-component `fmtCurrency` inline functions
 * that were duplicated across 40+ files.
 */

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string): Intl.NumberFormat {
  if (!formatterCache.has(currency)) {
    formatterCache.set(
      currency,
      new Intl.NumberFormat('es-AR', { style: 'currency', currency }),
    );
  }
  return formatterCache.get(currency)!;
}

/**
 * Format a number as Argentine-locale currency.
 * @param value  Numeric amount
 * @param currency  ISO 4217 currency code (default: 'ARS')
 */
export function formatCurrency(value: number, currency = 'ARS'): string {
  return getFormatter(currency).format(value);
}
