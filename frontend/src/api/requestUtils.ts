/** Shared request parameter utilities used by all API services. */

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationParams {
  page?:     number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  data:     T[];
  total:    number;
  page:     number;
  pageSize: number;
}

// ─── Date range ───────────────────────────────────────────────────────────────
export interface DateRangeParams {
  from?: string; // ISO 8601
  to?:   string;
}

/** Returns today's ISO date range (start of day → now). */
export function todayRange(): DateRangeParams {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: new Date().toISOString() };
}

/** Returns the current month's ISO date range. */
export function thisMonthRange(): DateRangeParams {
  const now   = new Date();
  const from  = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: from.toISOString(), to: now.toISOString() };
}

// ─── Filter builder ───────────────────────────────────────────────────────────
/**
 * Removes undefined / null / empty-string values from a params object
 * so they don't get serialised as empty query strings.
 *
 * Usage: apiClient.get('/products', { params: cleanParams({ search, categoryId }) })
 */
export function cleanParams<T extends Record<string, any>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ) as Partial<T>;
}

// ─── Sorting ──────────────────────────────────────────────────────────────────
export interface SortParams {
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
}
