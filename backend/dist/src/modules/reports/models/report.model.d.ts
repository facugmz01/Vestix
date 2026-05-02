export interface DateRangeFilter {
    from: Date;
    to: Date;
    branchId?: string;
}
export interface SalesSummaryReport {
    period: {
        from: Date;
        to: Date;
    };
    totalOrders: number;
    totalRevenue: number;
    totalDiscounts: number;
    netRevenue: number;
    averageOrderValue: number;
    byPaymentMethod: Record<string, number>;
    byChannel: Record<string, number>;
}
export interface TopSellingVariant {
    variantId: string;
    name: string;
    sku: string;
    totalUnitsSold: number;
    totalRevenue: number;
}
export interface StockValuationReport {
    generatedAt: Date;
    branchId?: string;
    totalSKUs: number;
    totalUnits: number;
    totalValueAtCost: number;
    totalValueAtRetail: number;
    potentialMargin: number;
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
    reorderPoint: number;
}
export interface CogsReport {
    period: {
        from: Date;
        to: Date;
    };
    totalCOGS: number;
    totalRevenue: number;
    grossProfit: number;
    grossMarginPct: number;
}
export interface DashboardSummary {
    generatedAt: Date;
    today: {
        revenue: number;
        orders: number;
        avgOrderValue: number;
        cashInDrawers: number;
    };
    thisMonth: {
        revenue: number;
        orders: number;
        grossMarginPct: number;
    };
    topSellers: TopSellingVariant[];
    lowStockAlerts: LowStockAlert[];
    pendingOrders: number;
}
