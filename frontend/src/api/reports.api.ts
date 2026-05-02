import { get, post } from './client';
import { cleanParams } from './requestUtils';
import type { DashboardSummary, SalesSummaryReport, TopSellingVariant, LowStockAlert } from '@/types';

export interface CogsReport {
  period:         { from: string; to: string };
  totalCOGS:      number;
  totalRevenue:   number;
  grossProfit:    number;
  grossMarginPct: number;
}

export interface StockValuationReport {
  generatedAt:        string;
  branchId?:          string;
  totalSKUs:          number;
  totalUnits:         number;
  totalValueAtCost:   number;
  totalValueAtRetail: number;
  potentialMargin:    number;
  lines:              unknown[];
}

export interface PurchasesSummaryReport {
  period:           { from: string; to: string };
  totalOrders:      number;
  totalAmount:      number;
  totalReceived:    number;
  pendingAmount:    number;
  topSuppliers:     { supplierName: string; totalAmount: number }[];
}

export interface CashSummaryReport {
  period:           { from: string; to: string };
  totalIncome:      number;
  totalExpenses:    number;
  netCash:          number;
  byMethod:         { method: string; amount: number }[];
  dailySeries:      { date: string; income: number; expenses: number }[];
}

export const reportsApi = {
  getDashboard: (branchId?: string) =>
    get<DashboardSummary>('/reports/dashboard', { params: cleanParams({ branchId }) }),

  getSalesSummary: (from: string, to: string, branchId?: string) =>
    get<SalesSummaryReport>('/reports/sales/summary', { params: cleanParams({ from, to, branchId }) }),

  getTopSellers: (from: string, to: string, limit?: number) =>
    get<TopSellingVariant[]>('/reports/sales/top-sellers', { params: cleanParams({ from, to, limit }) }),

  getCogs: (from: string, to: string) =>
    get<CogsReport>('/reports/sales/cogs', { params: { from, to } }),

  getStockValuation: (branchId?: string) =>
    get<StockValuationReport>('/reports/stock/valuation', { params: cleanParams({ branchId }) }),

  getLowStockAlerts: (branchId?: string, reorderPoint?: number) =>
    get<LowStockAlert[]>('/reports/stock/low-stock', { params: cleanParams({ branchId, reorderPoint }) }),

  getPurchasesSummary: (from: string, to: string) =>
    get<PurchasesSummaryReport>('/reports/purchases/summary', { params: { from, to } }),

  getCashSummary: (from: string, to: string, branchId?: string) =>
    get<CashSummaryReport>('/reports/cash/summary', { params: cleanParams({ from, to, branchId }) }),

  exportReport: (type: string, params: Record<string, string>) =>
    post<{ downloadUrl: string }>(`/reports/export/${type}`, params),
};

