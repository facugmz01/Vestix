/**
 * Centralised TanStack Query key factory.
 * Naming convention: [domain, scope?, identifier?]
 * Keeps cache invalidation consistent and avoids magic string arrays.
 */

const withFilters = (base: string[], filters?: object) => filters ? [...base, filters] : base;

export const queryKeys = {
  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    me: () => ['auth', 'me'] as const,
  },

  // ── Users & Roles ─────────────────────────────────────────────────────────
  users: {
    all:    (filters?: object) => withFilters(['users', 'list'], filters),
    detail: (id: string)       => ['users', 'detail', id] as const,
  },
  roles: {
    all:    (filters?: object) => withFilters(['roles', 'list'], filters),
    detail: (id: string)       => ['roles', 'detail', id] as const,
  },
  branches: {
    all:    (filters?: object) => withFilters(['branches', 'list'], filters),
    detail: (id: string)       => ['branches', 'detail', id] as const,
  },
  warehouses: {
    all:    (filters?: object) => withFilters(['warehouses', 'list'], filters),
    detail: (id: string)       => ['warehouses', 'detail', id] as const,
  },
  locations: {
    all:    (filters?: object) => withFilters(['locations', 'list'], filters),
    detail: (id: string)       => ['locations', 'detail', id] as const,
  },
  cashRegisters: {
    all:    (filters?: object) => withFilters(['cashRegisters', 'list'], filters),
    detail: (id: string)       => ['cashRegisters', 'detail', id] as const,
  },

  // ── Catalog ───────────────────────────────────────────────────────────────
  products: {
    all:     (filters?: object)    => withFilters(['products', 'list'], filters),
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
    public:   (filters?: object)  => withFilters(['catalog', 'public'], filters),
    posSync:  (branchId?: string) => branchId ? ['catalog', 'pos-sync', branchId] : ['catalog', 'pos-sync'],
  },
  priceLists: {
    all:    (filters?: object) => withFilters(['priceLists', 'list'], filters),
    detail: (id: string)       => ['priceLists', 'detail', id]    as const,
    items:  (id: string)       => ['priceLists', 'items', id]     as const,
  },
  promotions: {
    all:       (filters?: object) => withFilters(['promotions', 'list'], filters),
    detail:    (id: string)       => ['promotions', 'detail', id]    as const,
    conflicts: ()                 => ['promotions', 'conflicts']     as const,
    impact:    (id: string)       => ['promotions', 'impact', id]    as const,
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  stock: {
    all:       (filters?: object) => withFilters(['stock', 'list'], filters),
    movements: (filters?: object) => withFilters(['stock', 'movements'], filters),
    movementDetail: (id: string)  => ['stock', 'movement-detail', id] as const,
  },
  transfers: {
    all:    (filters?: object) => withFilters(['transfers', 'list'], filters),
    detail: (id: string)       => ['transfers', 'detail', id]    as const,
  },
  purchases: {
    all:    (filters?: object) => withFilters(['purchases', 'list'], filters),
    detail: (id: string)       => ['purchases', 'detail', id]    as const,
  },
  receipts: {
    all:    (filters?: object) => withFilters(['receipts', 'list'], filters),
    detail: (id: string)       => ['receipts', 'detail', id]    as const,
  },
  finance: {
    currentAccounts: (filters?: object) => withFilters(['finance', 'currentAccounts'], filters),
    movements:       (accountId: string, filters?: object) => withFilters(['finance', 'movements', accountId], filters),
  },
  treasury: {
    shifts:          (filters?: object) => withFilters(['treasury', 'shifts'], filters),
    shiftDetail:     (id: string)       => ['treasury', 'shifts', id] as const,
    shiftMovements:  (id: string)       => ['treasury', 'shifts', id, 'movements'] as const,
  },
  payments: {
    all:    (filters?: object) => withFilters(['payments', 'list'], filters),
    detail: (id: string)       => ['payments', 'detail', id]    as const,
  },
  invoices: {
    all:    (filters?: object) => withFilters(['invoices', 'list'], filters),
    detail: (id: string)       => ['invoices', 'detail', id]    as const,
    bySale: (saleId: string)   => ['invoices', 'sale', saleId]  as const,
  },
  notifications: {
    templates: (filters?: object) => withFilters(['notifications', 'templates'], filters),
    template:  (id: string)       => ['notifications', 'template', id] as const,
    logs:      (filters?: object) => withFilters(['notifications', 'logs'], filters),
  },
  integrations: {
    all:         ()         => ['integrations', 'list'] as const,
    detail:      (id: string) => ['integrations', 'detail', id] as const,
    webhookLogs: (id: string, filters?: object) => withFilters(['integrations', id, 'webhooks'], filters),
    failedAfipJobs: () => ['integrations', 'afip', 'failed-jobs'] as const,
  },
  audit: {
    logs:   (filters?: object) => withFilters(['audit', 'logs'], filters),
    detail: (id: string)       => ['audit', 'log', id] as const,
    trace:  (entityType: string, entityId: string) => ['audit', 'trace', entityType, entityId] as const,
  },
  sales: {
    all:    (filters?: object) => withFilters(['sales', 'list'], filters),
    detail: (id: string)       => ['sales', 'detail', id]    as const,
  },
  returns: {
    all:    (filters?: object) => withFilters(['returns', 'list'], filters),
    detail: (id: string)       => ['returns', 'detail', id]    as const,
  },
  pos: {
    session:   () => ['pos', 'session'] as const,
    registers: (branchId?: string) => branchId ? ['pos', 'registers', branchId] : ['pos', 'registers'],
  },
  reservations: {
    all:    (filters?: object) => withFilters(['reservations', 'list'], filters),
    detail: (id: string)       => ['reservations', 'detail', id]    as const,
  },
  storefront: {
    products: (filters?: object) => withFilters(['storefront', 'products'], filters),
    product:  (id: string)       => ['storefront', 'product', id] as const,
    myOrders: ()                 => ['storefront', 'myOrders'] as const,
    order:    (id: string)       => ['storefront', 'order', id] as const,
  },

  // ── Purchasing ────────────────────────────────────────────────────────────
  purchaseOrders: {
    all:    (filters?: object) => withFilters(['purchase-orders', 'list'], filters),
    detail: (id: string)       => ['purchase-orders', 'detail', id]   as const,
  },
  suppliers: {
    all:    (filters?: object) => withFilters(['suppliers', 'list'], filters),
    detail: (id: string)       => ['suppliers', 'detail', id]   as const,
    ledger: (id: string)       => ['suppliers', 'ledger', id]   as const,
  },

  // ── Sales ─────────────────────────────────────────────────────────────────
  orders: {
    all:         (filters?: object) => withFilters(['orders', 'list'], filters),
    detail:      (id: string)       => ['orders', 'detail', id]         as const,
    fulfillment: (id: string)       => ['orders', 'fulfillment', id]    as const,
  },

  // ── Customers ─────────────────────────────────────────────────────────────
  customers: {
    all:     (filters?: object) => withFilters(['customers', 'list'], filters),
    detail:  (id: string)       => ['customers', 'detail', id]   as const,
    history: (id: string)       => ['customers', 'history', id]  as const,
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  accounts: {
    all:          () => ['accounts', 'list'] as const,
    detail: (id: string) => ['accounts', 'detail', id] as const,
  },
  shifts: {
    active: (accountId?: string) => accountId ? ['shifts', 'active', accountId] : ['shifts', 'active'],
    all:    () => ['shifts', 'list'] as const,
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  reports: {
    dashboard:        (branchId?: string)                           => branchId ? ['reports', 'dashboard', branchId] : ['reports', 'dashboard'],
    salesSummary:     (from: string, to: string, branchId?: string) => branchId ? ['reports', 'sales-summary', from, to, branchId] : ['reports', 'sales-summary', from, to],
    topSellers:       (from: string, to: string)                    => ['reports', 'top-sellers', from, to]             as const,
    cogs:             (from: string, to: string)                    => ['reports', 'cogs', from, to]                    as const,
    stockValuation:   (branchId?: string)                           => branchId ? ['reports', 'stock-valuation', branchId] : ['reports', 'stock-valuation'],
    lowStock:         (branchId?: string, reorderPoint?: number)    => ['reports', 'low-stock', branchId, reorderPoint] as const,
    purchasesSummary: (from: string, to: string)                    => ['reports', 'purchases-summary', from, to]       as const,
    cashSummary:      (from: string, to: string, branchId?: string) => branchId ? ['reports', 'cash-summary', from, to, branchId] : ['reports', 'cash-summary', from, to],
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    get: () => ['settings'] as const,
  },
} as const;
