export interface DateRangeFilter {
  from: Date;
  to: Date;
  branchId?: string;
}

// ─── SALES REPORT SHAPES ─────────────────────────────────────────────────────

export interface SalesSummaryReport {
  period: { from: Date; to: Date };
  totalOrders: number;
  totalRevenue: number;
  totalDiscounts: number;
  netRevenue: number;
  averageOrderValue: number;
  byPaymentMethod: { method: string; count: number; amount: number }[];
  byChannel: Record<string, number>;       // e.g., { POS: 9000, ECOMMERCE: 4000 }
}

export interface TopSellingVariant {
  variantId: string;
  name: string;
  sku: string;
  totalUnitsSold: number;
  totalRevenue: number;
}

// ─── STOCK REPORT SHAPES ─────────────────────────────────────────────────────

export interface StockValuationReport {
  generatedAt: Date;
  branchId?: string;
  totalSKUs: number;
  totalUnits: number;
  totalValueAtCost: number;    // WAC × quantity for each SKU
  totalValueAtRetail: number;  // Base price × quantity for each SKU
  potentialMargin: number;     // ( retail - cost ) / retail
  lines: {
    variantId: string;
    sku: string;
    availableQty: number;
    reservedQty: number;
    unitCostWac: number;
    unitRetailPrice: number;
    totalCostValue: number;
    totalRetailValue: number;
  }[];
}

export interface LowStockAlert {
  variantId: string;
  sku: string;
  name: string;
  branchId: string;
  availableQuantity: number;
  reorderPoint: number; // When qty falls below this, trigger alert
}

// ─── COGS REPORT SHAPES ──────────────────────────────────────────────────────

export interface CogsReport {
  period: { from: Date; to: Date };
  totalCOGS: number;        // Sum of ( unitCost × qtySold ) for all sale movements
  totalRevenue: number;
  grossProfit: number;      // Revenue - COGS
  grossMarginPct: number;   // grossProfit / revenue
}

// ─── DASHBOARD SHAPE ─────────────────────────────────────────────────────────

export interface DashboardSummary {
  generatedAt: Date;
  today: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    /** Saldo real de cuentas CASH activas (tesorería) */
    cashInDrawers: number;
    /** Compras creadas hoy (total facturado) */
    purchasesTotal: number;
    /** Pagos a proveedores hoy (CREDIT en ledger) */
    supplierPayments: number;
  };
  thisMonth: {
    revenue: number;
    orders: number;
    grossMarginPct: number;
    purchasesTotal: number;
    purchasesPaid: number;
    purchasesDebt: number;
    cashIncome: number;
    cashExpenses: number;
    netCash: number;
  };
  /** Deuda abierta actual a proveedores (Supplier.balance) */
  supplierPayableBalance: number;
  topSellers: TopSellingVariant[];
  lowStockAlerts: LowStockAlert[];
  pendingOrders: number;   // E-commerce orders not yet shipped
}
