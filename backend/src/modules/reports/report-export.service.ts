import { Injectable, BadRequestException } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';

export type ReportExportType = 'sales' | 'stock' | 'purchases' | 'cash';

export interface ReportExportParams {
  from?: string;
  to?: string;
  branchId?: string;
  reorderPoint?: string;
}

export interface ReportExportResult {
  downloadUrl: string;
  base64: string;
  filename: string;
  contentType: string;
}

@Injectable()
export class ReportExportService {
  constructor(
    private readonly salesReport: SalesReportService,
    private readonly stockReport: StockReportService,
    private readonly cashReport: CashReportService,
    private readonly purchasesReport: PurchasesReportService,
  ) {}

  private parseDate(val: string | undefined, fallback: Date): Date {
    if (!val) return fallback;
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d;
  }

  private getDefaultFrom(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(1);
    return d;
  }

  private escapeCsv(value: unknown): string {
    if (value === null || value === undefined) return '';
    const str = value instanceof Date ? value.toISOString() : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  private toCsv(rows: string[][]): string {
    return rows.map(row => row.map(cell => this.escapeCsv(cell)).join(',')).join('\n');
  }

  private buildResult(csv: string, filename: string): ReportExportResult {
    const base64 = Buffer.from(csv, 'utf-8').toString('base64');
    const encoded = encodeURIComponent(csv);
    return {
      downloadUrl: `data:text/csv;charset=utf-8,${encoded}`,
      base64,
      filename,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  async export(type: string, params: ReportExportParams): Promise<ReportExportResult> {
    switch (type as ReportExportType) {
      case 'sales':
        return this.exportSales(params);
      case 'stock':
        return this.exportStock(params);
      case 'purchases':
        return this.exportPurchases(params);
      case 'cash':
        return this.exportCash(params);
      default:
        throw new BadRequestException(`Unsupported report export type: ${type}`);
    }
  }

  private async exportSales(params: ReportExportParams): Promise<ReportExportResult> {
    const from = this.parseDate(params.from, this.getDefaultFrom());
    const to = this.parseDate(params.to, new Date());
    const branchId = params.branchId || undefined;

    const filter = { from, to, branchId };
    const [summary, topSellers, cogs] = await Promise.all([
      this.salesReport.getSalesSummary(filter),
      this.salesReport.getTopSellers(filter),
      this.salesReport.getCogsReport(filter),
    ]);

    const rows: string[][] = [
      ['Sales Summary'],
      ['Period From', 'Period To', 'Branch ID'],
      [from.toISOString(), to.toISOString(), branchId ?? ''],
      [],
      ['Metric', 'Value'],
      ['Total Orders', String(summary.totalOrders)],
      ['Total Revenue', String(summary.totalRevenue)],
      ['Total Discounts', String(summary.totalDiscounts)],
      ['Net Revenue', String(summary.netRevenue)],
      ['Average Order Value', String(summary.averageOrderValue)],
      [],
      ['Payment Method', 'Count', 'Amount'],
      ...summary.byPaymentMethod.map(m => [m.method, String(m.count), String(m.amount)]),
      [],
      ['Channel', 'Amount'],
      ...Object.entries(summary.byChannel).map(([channel, amount]) => [channel, String(amount)]),
      [],
      ['COGS', 'Total Revenue', 'Gross Profit', 'Gross Margin %'],
      [String(cogs.totalCOGS), String(cogs.totalRevenue), String(cogs.grossProfit), String(cogs.grossMarginPct)],
      [],
      ['Top Sellers'],
      ['SKU', 'Name', 'Units Sold', 'Revenue'],
      ...topSellers.map(v => [v.sku, v.name, String(v.totalUnitsSold), String(v.totalRevenue)]),
    ];

    const stamp = from.toISOString().slice(0, 10);
    return this.buildResult(this.toCsv(rows), `sales-report-${stamp}.csv`);
  }

  private async exportStock(params: ReportExportParams): Promise<ReportExportResult> {
    const branchId = params.branchId || undefined;
    const reorderPoint = params.reorderPoint ? parseInt(params.reorderPoint, 10) : undefined;

    const [valuation, lowStock] = await Promise.all([
      this.stockReport.getStockValuation(branchId),
      this.stockReport.getLowStockAlerts(branchId, reorderPoint),
    ]);

    const rows: string[][] = [
      ['Stock Valuation'],
      ['Generated At', 'Branch ID', 'Total SKUs', 'Total Units', 'Value at Cost', 'Value at Retail', 'Potential Margin %'],
      [
        valuation.generatedAt.toISOString(),
        branchId ?? '',
        String(valuation.totalSKUs),
        String(valuation.totalUnits),
        String(valuation.totalValueAtCost),
        String(valuation.totalValueAtRetail),
        String(valuation.potentialMargin),
      ],
      [],
      ['SKU', 'Available Qty', 'Reserved Qty', 'Unit Cost', 'Unit Retail', 'Total Cost Value', 'Total Retail Value'],
      ...valuation.lines.map(l => [
        l.sku,
        String(l.availableQty),
        String(l.reservedQty),
        String(l.unitCostWac),
        String(l.unitRetailPrice),
        String(l.totalCostValue),
        String(l.totalRetailValue),
      ]),
      [],
      ['Low Stock Alerts'],
      ['SKU', 'Name', 'Branch ID', 'Available Qty', 'Reorder Point'],
      ...lowStock.map(a => [
        a.sku,
        a.name,
        a.branchId,
        String(a.availableQuantity),
        String(a.reorderPoint),
      ]),
    ];

    return this.buildResult(this.toCsv(rows), `stock-report-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  private async exportPurchases(params: ReportExportParams): Promise<ReportExportResult> {
    const from = this.parseDate(params.from, this.getDefaultFrom());
    const to = this.parseDate(params.to, new Date());

    const summary = await this.purchasesReport.getPurchasesSummary({ from, to });

    const rows: string[][] = [
      ['Purchases Summary'],
      ['Period From', 'Period To'],
      [from.toISOString(), to.toISOString()],
      [],
      ['Metric', 'Value'],
      ['Total Orders', String(summary.totalOrders)],
      ['Total Amount', String(summary.totalAmount)],
      ['Total Received', String(summary.totalReceived)],
      ['Pending Amount', String(summary.pendingAmount)],
      [],
      ['Top Suppliers'],
      ['Supplier', 'Total Amount'],
      ...summary.topSuppliers.map(s => [s.supplierName, String(s.totalAmount)]),
    ];

    const stamp = from.toISOString().slice(0, 10);
    return this.buildResult(this.toCsv(rows), `purchases-report-${stamp}.csv`);
  }

  private async exportCash(params: ReportExportParams): Promise<ReportExportResult> {
    const from = this.parseDate(params.from, this.getDefaultFrom());
    const to = this.parseDate(params.to, new Date());
    const branchId = params.branchId || undefined;

    const summary = await this.cashReport.getCashSummary({ from, to, branchId });

    const rows: string[][] = [
      ['Cash Summary'],
      ['Period From', 'Period To', 'Branch ID'],
      [from.toISOString(), to.toISOString(), branchId ?? ''],
      [],
      ['Metric', 'Value'],
      ['Total Income', String(summary.totalIncome)],
      ['Total Expenses', String(summary.totalExpenses)],
      ['Net Cash', String(summary.netCash)],
      [],
      ['By Method'],
      ['Method', 'Amount'],
      ...summary.byMethod.map(m => [m.method, String(m.amount)]),
      [],
      ['Daily Series'],
      ['Date', 'Income', 'Expenses'],
      ...summary.dailySeries.map(d => [d.date, String(d.income), String(d.expenses)]),
    ];

    const stamp = from.toISOString().slice(0, 10);
    return this.buildResult(this.toCsv(rows), `cash-report-${stamp}.csv`);
  }
}
