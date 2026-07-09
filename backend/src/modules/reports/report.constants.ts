/** Sale order statuses that count toward revenue KPIs (excludes quotes and cancellations). */
export const REVENUE_ELIGIBLE_STATUSES = [
  'COMPLETED',
  'CONFIRMED',
  'READY_FOR_PICKUP',
  'DELIVERED',
] as const;
