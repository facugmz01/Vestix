/** Sale order statuses that count toward revenue KPIs (excludes quotes and cancellations). */
export const REVENUE_ELIGIBLE_STATUSES = [
  'COMPLETED',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'DELIVERED',
] as const;

/** Sale order statuses excluded from pending delivery / dispatch counts (finished, delivered, cancelled, or quotes). */
export const NON_PENDING_ORDER_STATUSES = [
  'COMPLETED',
  'CANCELLED',
  'DELIVERED',
  'QUOTE',
  'QUOTATION',
] as const;
