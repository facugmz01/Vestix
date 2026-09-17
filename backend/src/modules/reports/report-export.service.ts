import { Injectable, BadRequestException } from '@nestjs/common';
import { SalesReportService } from './sales-report.service';
import { StockReportService } from './stock-report.service';
import { CashReportService } from './cash-report.service';
import { PurchasesReportService } from './purchases-report.service';
import { toStartOfDayArgentina, toEndOfDayArgentina } from './utils/report-date.util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

export type ReportExportType = 'sales' | 'stock' | 'purchases' | 'cash';

export interface ReportExportParams {
  from?: string;
  to?: string;
  branchId?: string;
  reorderPoint?: string;
  format?: 'csv' | 'pdf';
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

  private buildCsvResult(csv: string, filename: string): ReportExportResult {
    const base64 = Buffer.from(csv, 'utf-8').toString('base64');
    return {
      downloadUrl: `data:text/csv;charset=utf-8;base64,${base64}`,
      base64,
      filename,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  private buildPdfResult(buffer: Buffer, filename: string): ReportExportResult {
    const base64 = buffer.toString('base64');
    return {
      downloadUrl: `data:application/pdf;base64,${base64}`,
      base64,
      filename,
      contentType: 'application/pdf',
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
    const from = toStartOfDayArgentina(params.from);
    const to = toEndOfDayArgentina(params.to);
    const branchId = params.branchId || undefined;

    const filter = { from, to, branchId };
    const [summary, topSellers, cogs] = await Promise.all([
      this.salesReport.getSalesSummary(filter),
      this.salesReport.getTopSellers(filter, 15),
      this.salesReport.getCogsReport(filter),
    ]);

    const stamp = from.toISOString().slice(0, 10);

    if (params.format === 'pdf') {
      const pdfBuffer = await this.renderSalesPdf(from, to, branchId, summary, topSellers, cogs);
      return this.buildPdfResult(pdfBuffer, `informe-ventas-${stamp}.pdf`);
    }

    const rows: string[][] = [
      ['INFORME DE VENTAS — VESTIX ERP'],
      ['Desde', 'Hasta', 'Sucursal'],
      [from.toISOString(), to.toISOString(), branchId ?? 'Todas las sucursales'],
      [],
      ['MÉTRICAS PRINCIPALES', 'VALOR'],
      ['Total Facturado (Bruto)', `$${summary.totalRevenue.toFixed(2)}`],
      ['Total Descuentos', `$${summary.totalDiscounts.toFixed(2)}`],
      ['Ventas Netas', `$${summary.netRevenue.toFixed(2)}`],
      ['Cantidad de Órdenes', String(summary.totalOrders)],
      ['Ticket Promedio', `$${summary.averageOrderValue.toFixed(2)}`],
      ['CMV (Costo Mercadería Vendida)', `$${cogs.totalCOGS.toFixed(2)}`],
      ['Ganancia Bruta', `$${cogs.grossProfit.toFixed(2)}`],
      ['Margen Bruto %', `${cogs.grossMarginPct.toFixed(2)}%`],
      [],
      ['DESGLOSE POR MÉTODO DE PAGO', 'TRANSACCIONES', 'MONTO'],
      ...summary.byPaymentMethod.map(m => [m.method, String(m.count), `$${m.amount.toFixed(2)}`]),
      [],
      ['DESGLOSE POR CANAL', 'MONTO'],
      ...Object.entries(summary.byChannel).map(([ch, amt]) => [ch, `$${amt.toFixed(2)}`]),
      [],
      ['TOP PRODUCTOS MÁS VENDIDOS'],
      ['SKU', 'Nombre', 'Categoría', 'Unidades Vendidas', 'Ingresos Netos'],
      ...topSellers.map(v => [v.sku, v.name, v.category || '-', String(v.totalUnitsSold), `$${v.totalRevenue.toFixed(2)}`]),
    ];

    return this.buildCsvResult(this.toCsv(rows), `informe-ventas-${stamp}.csv`);
  }

  private async exportStock(params: ReportExportParams): Promise<ReportExportResult> {
    const branchId = params.branchId || undefined;
    const reorderPoint = params.reorderPoint ? parseInt(params.reorderPoint, 10) : undefined;

    const [valuation, lowStock] = await Promise.all([
      this.stockReport.getStockValuation(branchId),
      this.stockReport.getLowStockAlerts(branchId, reorderPoint),
    ]);

    const stamp = new Date().toISOString().slice(0, 10);

    const rows: string[][] = [
      ['VALORACIÓN DE STOCK — VESTIX ERP'],
      ['Generado el', 'Sucursal', 'Total SKUs', 'Unidades en Stock', 'Valor al Costo', 'Valor al Público', 'Margen Potencial %'],
      [
        valuation.generatedAt.toISOString(),
        branchId ?? 'Todas las sucursales',
        String(valuation.totalSKUs),
        String(valuation.totalUnits),
        `$${valuation.totalValueAtCost.toFixed(2)}`,
        `$${valuation.totalValueAtRetail.toFixed(2)}`,
        `${valuation.potentialMargin.toFixed(2)}%`,
      ],
      [],
      ['DETALLE DE VALORACIÓN POR SKU'],
      ['SKU', 'Disponible', 'Reservado', 'Costo Unitario (WAC)', 'Precio Público', 'Valor Costo Total', 'Valor Venta Total'],
      ...valuation.lines.map(l => [
        l.sku,
        String(l.availableQty),
        String(l.reservedQty),
        `$${l.unitCostWac.toFixed(2)}`,
        `$${l.unitRetailPrice.toFixed(2)}`,
        `$${l.totalCostValue.toFixed(2)}`,
        `$${l.totalRetailValue.toFixed(2)}`,
      ]),
      [],
      ['ALERTAS DE STOCK BAJO'],
      ['SKU', 'Nombre', 'Sucursal', 'Cantidad Disponible', 'Punto de Reorden'],
      ...lowStock.map(a => [
        a.sku,
        a.name,
        a.branchId,
        String(a.availableQuantity),
        String(a.reorderPoint),
      ]),
    ];

    return this.buildCsvResult(this.toCsv(rows), `informe-stock-${stamp}.csv`);
  }

  private async exportPurchases(params: ReportExportParams): Promise<ReportExportResult> {
    const from = toStartOfDayArgentina(params.from);
    const to = toEndOfDayArgentina(params.to);
    const branchId = params.branchId || undefined;

    const summary = await this.purchasesReport.getPurchasesSummary({ from, to, branchId });
    const stamp = from.toISOString().slice(0, 10);

    const rows: string[][] = [
      ['INFORME DE COMPRAS — VESTIX ERP'],
      ['Desde', 'Hasta', 'Sucursal'],
      [from.toISOString(), to.toISOString(), branchId ?? 'Todas las sucursales'],
      [],
      ['Métrica', 'Valor'],
      ['Total de Órdenes', String(summary.totalOrders)],
      ['Total Comprado', `$${summary.totalAmount.toFixed(2)}`],
      ['Total Pagado', `$${summary.totalReceived.toFixed(2)}`],
      ['Deuda Pendiente', `$${summary.pendingAmount.toFixed(2)}`],
      [],
      ['TOP PROVEEDORES POR MONTO'],
      ['Proveedor', 'Monto Total'],
      ...summary.topSuppliers.map(s => [s.supplierName, `$${s.totalAmount.toFixed(2)}`]),
    ];

    return this.buildCsvResult(this.toCsv(rows), `informe-compras-${stamp}.csv`);
  }

  private async exportCash(params: ReportExportParams): Promise<ReportExportResult> {
    const from = toStartOfDayArgentina(params.from);
    const to = toEndOfDayArgentina(params.to);
    const branchId = params.branchId || undefined;

    const summary = await this.cashReport.getCashSummary({ from, to, branchId });
    const stamp = from.toISOString().slice(0, 10);

    const rows: string[][] = [
      ['INFORME DE CAJA Y TESORERÍA — VESTIX ERP'],
      ['Desde', 'Hasta', 'Sucursal'],
      [from.toISOString(), to.toISOString(), branchId ?? 'Todas las sucursales'],
      [],
      ['Métrica', 'Valor'],
      ['Total Ingresos (Cobros)', `$${summary.totalIncome.toFixed(2)}`],
      ['Total Egresos (Pagos/Gastos)', `$${summary.totalExpenses.toFixed(2)}`],
      ['Resultado Neto de Caja', `$${summary.netCash.toFixed(2)}`],
      [],
      ['INGRESOS POR MEDIO DE COBRO'],
      ['Medio', 'Monto'],
      ...summary.byMethod.map(m => [m.method, `$${m.amount.toFixed(2)}`]),
      [],
      ['EVOLUCIÓN DIARIA'],
      ['Fecha', 'Ingresos', 'Egresos'],
      ...summary.dailySeries.map(d => [d.date, `$${d.income.toFixed(2)}`, `$${d.expenses.toFixed(2)}`]),
    ];

    return this.buildCsvResult(this.toCsv(rows), `informe-caja-${stamp}.csv`);
  }

  /**
   * Generates a PDF document for Sales Reports using pdfkit.
   */
  private renderSalesPdf(
    from: Date,
    to: Date,
    branchId: string | undefined,
    summary: any,
    topSellers: any[],
    cogs: any,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (data: Buffer) => buffers.push(data));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err: any) => reject(err));

        // Header
        doc.fontSize(18).fillColor('#1e293b').text('Vestix ERP — Informe Ejecutivo de Ventas', { align: 'left' });
        doc.fontSize(10).fillColor('#64748b').text(`Período: ${from.toLocaleDateString('es-AR')} al ${to.toLocaleDateString('es-AR')} | Sucursal: ${branchId || 'Todas'}`);
        doc.moveDown(1.5);

        // KPI Box
        const netSales = summary.totalNetSales ?? summary.netRevenue ?? 0;
        const avgTicket = summary.averageTicket ?? summary.averageOrderValue ?? 0;
        const grossSales = summary.totalGrossSales ?? summary.totalRevenue ?? 0;
        const discounts = summary.totalDiscounts ?? 0;
        const cogsTotal = cogs.totalCOGS ?? 0;
        const profitTotal = cogs.grossProfit ?? 0;
        const marginPct = cogs.grossMarginPct ?? 0;

        doc.rect(40, doc.y, 515, 65).fillAndStroke('#f8fafc', '#e2e8f0');
        const boxY = doc.y + 12;
        doc.fillColor('#0f172a').fontSize(11).text('Ventas Netas:', 55, boxY);
        doc.fontSize(16).fillColor('#10b981').text(`$${netSales.toLocaleString('es-AR')}`, 55, boxY + 16);

        doc.fontSize(11).fillColor('#0f172a').text('Ticket Promedio:', 185, boxY);
        doc.fontSize(16).fillColor('#3b82f6').text(`$${avgTicket.toLocaleString('es-AR')}`, 185, boxY + 16);

        doc.fontSize(11).fillColor('#0f172a').text('Total Órdenes:', 315, boxY);
        doc.fontSize(16).fillColor('#6366f1').text(`${summary.totalOrders}`, 315, boxY + 16);

        doc.fontSize(11).fillColor('#0f172a').text('Margen Bruto:', 425, boxY);
        doc.fontSize(16).fillColor('#f59e0b').text(`${marginPct.toFixed(1)}%`, 425, boxY + 16);

        doc.moveDown(4.5);

        // Breakdown section
        doc.fontSize(13).fillColor('#1e293b').text('Desglose Financiero y de Rentabilidad');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#334155');
        doc.text(`• Total Facturado Bruto: $${grossSales.toLocaleString('es-AR')}`);
        doc.text(`• Descuentos Aplicados: $${discounts.toLocaleString('es-AR')}`);
        doc.text(`• Costo de Mercadería Vendida (CMV): $${cogsTotal.toLocaleString('es-AR')}`);
        doc.text(`• Ganancia Bruta Operativa: $${profitTotal.toLocaleString('es-AR')}`);
        doc.moveDown(1.5);

        // Top sellers table
        doc.fontSize(13).fillColor('#1e293b').text('Top Productos Más Vendidos');
        doc.moveDown(0.5);

        // Table Header
        let tableY = doc.y;
        doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(9).text('SKU', 50, tableY + 5);
        doc.text('PRODUCTO', 140, tableY + 5);
        doc.text('CATEGORÍA', 310, tableY + 5);
        doc.text('UNID.', 410, tableY + 5, { width: 40, align: 'right' });
        doc.text('TOTAL', 470, tableY + 5, { width: 75, align: 'right' });

        tableY += 22;
        doc.fillColor('#1e293b').fontSize(9);

        topSellers.slice(0, 10).forEach((item) => {
          doc.text(item.sku, 50, tableY);
          doc.text(item.name.slice(0, 26), 140, tableY);
          doc.text((item.category || 'General').slice(0, 16), 310, tableY);
          doc.text(String(item.totalUnitsSold), 410, tableY, { width: 40, align: 'right' });
          doc.text(`$${item.totalRevenue.toLocaleString('es-AR')}`, 470, tableY, { width: 75, align: 'right' });
          tableY += 18;
        });

        // Footer
        doc.fontSize(8).fillColor('#94a3b8').text(
          `Generado automáticamente por Vestix ERP el ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`,
          40,
          780,
          { align: 'center', width: 515 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
