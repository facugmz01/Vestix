/**
 * Centralised TanStack Query key factory.
 * Naming convention: [domain, scope?, identifier?]
 * Keeps cache invalidation consistent and avoids magic string arrays.
 */
export const queryKeys = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // ── Users & Roles ─────────────────────────────────────────────────────────
  users: {
    all:    (filters?: object) => ['users', 'list', filters] as const,
    detail: (id: string)       => ['users', 'detail', id] as const,
  },
  roles: {
    all:    (filters?: object) => ['roles', 'list', filters] as const,
    detail: (id: string)       => ['roles', 'detail', id] as const,
  },
  branches: {
    all:    (filters?: object) => ['branches', 'list', filters] as const,
    detail: (id: string)       => ['branches', 'detail', id] as const,
  },
  warehouses: {
    all:    (filters?: object) => ['warehouses', 'list', filters] as const,
    detail: (id: string)       => ['warehouses', 'detail', id] as const,
  },
  locations: {
    all:    (filters?: object) => ['locations', 'list', filters] as const,
    detail: (id: string)       => ['locations', 'detail', id] as const,
  },
  cashRegisters: {
    all:    (filters?: object) => ['cashRegisters', 'list', filters] as const,
    detail: (id: string)       => ['cashRegisters', 'detail', id] as const,
  },

  // ── Catalog ───────────────────────────────────────────────────────────────
  products: {
    all:     (filters?: object)    => ['products', 'list', filters]   as const,
    detail:  (id: string)          => ['products', 'detail', id]      as const,
    variants:(productId: string)   => ['products', 'variants', productId] as const,
  },
  categories: {
    all: () => ['categories', 'list'] as const,
  },
  brands: {
    all: () => ['brands', 'list'] as const,
  },
  catalog: {
    public:   (filters?: object)  => ['catalog', 'public', filters]   as const,
    posSync:  (branchId: string)  => ['catalog', 'pos-sync', branchId] as const,
  },
  priceLists: {
    all:    (filters?: object) => ['priceLists', 'list', filters] as const,
    detail: (id: string)       => ['priceLists', 'detail', id]    as const,
    items:  (id: string)       => ['priceLists', 'items', id]     as const,
  },
  promotions: {
    all:       (filters?: object) => ['promotions', 'list', filters] as const,
    detail:    (id: string)       => ['promotions', 'detail', id]    as const,
    conflicts: ()                 => ['promotions', 'conflicts']     as const,
    impact:    (id: string)       => ['promotions', 'impact', id]    as const,
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  stock: {
    all:       (filters?: object) => ['stock', 'list', filters] as const,
    movements: (filters?: object) => ['stock', 'movements', filters] as const,
    movementDetail: (id: string)  => ['stock', 'movement-detail', id] as const,
  },
  transfers: {
    all:    (filters?: object) => ['transfers', 'list', filters] as const,
    detail: (id: string)       => ['transfers', 'detail', id]    as const,
  },
  purchases: {
    all:    (filters?: object) => ['purchases', 'list', filters] as const,
    detail: (id: string)       => ['purchases', 'detail', id]    as const,
  },
  receipts: {
    all:    (filters?: object) => ['receipts', 'list', filters] as const,
    detail: (id: string)       => ['receipts', 'detail', id]    as const,
  },
  finance: {
    currentAccounts: (filters?: object) => ['finance', 'currentAccounts', filters] as const,
    movements:       (accountId: string, filters?: object) => ['finance', 'movements', accountId, filters] as const,
  },
  treasury: {
    shifts:          (filters?: object) => ['treasury', 'shifts', filters] as const,
    shiftDetail:     (id: string)       => ['treasury', 'shifts', id] as const,
    shiftMovements:  (id: string)       => ['treasury', 'shifts', id, 'movements'] as const,
  },
  payments: {
    all:    (filters?: object) => ['payments', 'list', filters] as const,
    detail: (id: string)       => ['payments', 'detail', id]    as const,
  },
  invoices: {
    all:    (filters?: object) => ['invoices', 'list', filters] as const,
    detail: (id: string)       => ['invoices', 'detail', id]    as const,
    bySale: (saleId: string)   => ['invoices', 'sale', saleId]  as const,
  },
  notifications: {
    templates: (filters?: object) => ['notifications', 'templates', filters] as const,
    template:  (id: string)       => ['notifications', 'template', id] as const,
    logs:      (filters?: object) => ['notifications', 'logs', filters] as const,
  },
  integrations: {
    all:         ()         => ['integrations', 'list'] as const,
    detail:      (id: string) => ['integrations', 'detail', id] as const,
    webhookLogs: (id: string, filters?: object) => ['integrations', id, 'webhooks', filters] as const,
  },
  audit: {
    logs:   (filters?: object) => ['audit', 'logs', filters] as const,
    detail: (id: string)       => ['audit', 'log', id] as const,
    trace:  (entityType: string, entityId: string) => ['audit', 'trace', entityType, entityId] as const,
  },
  sales: {
    all:    (filters?: object) => ['sales', 'list', filters] as const,
    detail: (id: string)       => ['sales', 'detail', id]    as const,
  },
  returns: {
    all:    (filters?: object) => ['returns', 'list', filters] as const,
    detail: (id: string)       => ['returns', 'detail', id]    as const,
  },
  pos: {
    session:   () => ['pos', 'session'] as const,
    registers: (branchId: string) => ['pos', 'registers', branchId] as const,
  },
  reservations: {
    all:    (filters?: object) => ['reservations', 'list', filters] as const,
    detail: (id: string)       => ['reservations', 'detail', id]    as const,
  },
  storefront: {
    products: (filters?: object) => ['storefront', 'products', filters] as const,
    product:  (id: string)       => ['storefront', 'product', id] as const,
    myOrders: ()                 => ['storefront', 'myOrders'] as const,
    order:    (id: string)       => ['storefront', 'order', id] as const,
  },

  // ── Purchasing ────────────────────────────────────────────────────────────
  purchaseOrders: {
    all:    (filters?: object) => ['purchase-orders', 'list', filters] as const,
    detail: (id: string)       => ['purchase-orders', 'detail', id]   as const,
  },
  suppliers: {
    all:    (filters?: object) => ['suppliers', 'list', filters] as const,
    detail: (id: string)       => ['suppliers', 'detail', id]   as const,
    ledger: (id: string)       => ['suppliers', 'ledger', id]   as const,
  },

  // ── Sales ─────────────────────────────────────────────────────────────────
  orders: {
    all:         (filters?: object) => ['orders', 'list', filters]      as const,
    detail:      (id: string)       => ['orders', 'detail', id]         as const,
    fulfillment: (id: string)       => ['orders', 'fulfillment', id]    as const,
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  customers: {
    all:     (filters?: object) => ['customers', 'list', filters] as const,
    detail:  (id: string)       => ['customers', 'detail', id]   as const,
    history: (id: string)       => ['customers', 'history', id]  as const,
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  accounts: {
    all:          () => ['accounts', 'list'] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
  },
  shifts: {
    active: (accountId: string) => ['shifts', 'active', accountId] as const,
    all:    () => ['shifts', 'list'] as const,
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  reports: {
    dashboard:        (branchId?: string)                           => ['reports', 'dashboard', branchId]              as const,
    salesSummary:     (from: string, to: string, branchId?: string) => ['reports', 'sales-summary', from, to, branchId] as const,
    topSellers:       (from: string, to: string)                    => ['reports', 'top-sellers', from, to]             as const,
    cogs:             (from: string, to: string)                    => ['reports', 'cogs', from, to]                    as const,
    stockValuation:   (branchId?: string)                           => ['reports', 'stock-valuation', branchId]         as const,
    lowStock:         (branchId?: string, reorderPoint?: number)    => ['reports', 'low-stock', branchId, reorderPoint] as const,
    purchasesSummary: (from: string, to: string)                    => ['reports', 'purchases-summary', from, to]       as const,
    cashSummary:      (from: string, to: string, branchId?: string) => ['reports', 'cash-summary', from, to, branchId]  as const,
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: () => ['settings'] as const,
  },
} as const;
