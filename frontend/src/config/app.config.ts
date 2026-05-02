/** Centralised app-wide configuration derived from env vars. */
export const APP_CONFIG = {
  apiBase:     import.meta.env.VITE_API_BASE     ?? '/api',
  appName:     import.meta.env.VITE_APP_NAME     ?? 'ERP Retail',
  appVersion:  import.meta.env.VITE_APP_VERSION  ?? '1.0.0',
  environment: import.meta.env.VITE_ENV          ?? 'development',

  // Currency / locale settings (Argentina defaults)
  locale:   'es-AR',
  currency: 'ARS',

  // POS offline settings
  posOfflineTtlMs:        8 * 60 * 60 * 1000, // 8h
  reservationTtlMinutes:  15,

  // Pagination defaults
  defaultPageSize: 25,
} as const;

/** Format ARS currency consistently across the UI. */
export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat(APP_CONFIG.locale, {
    style: 'currency',
    currency: APP_CONFIG.currency,
    minimumFractionDigits: 2,
  }).format(amount);

/** Format date/time for display. */
export const formatDate = (iso: string, time = false) =>
  new Intl.DateTimeFormat(APP_CONFIG.locale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(time ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(iso));
