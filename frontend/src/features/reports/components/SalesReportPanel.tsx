import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, TrendingUp, ShoppingBag, CreditCard, FileText, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import {
  KpiCard,
  KpiCardSkeleton,
  ChartSkeleton,
  ResponsiveBarChart,
  EmptyState,
  ErrorState,
} from './ChartPrimitives';
import { downloadReportBlob } from '../utils/downloadReport';
import { formatCurrency } from '@/utils/formatCurrency';
import rs from '@/styles/ReportsShared.module.css';

interface Props {
  from: string;
  to: string;
  branchId?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

function PaymentMethodTable({
  rows,
  totalRevenue,
}: {
  rows: { method: string; count: number; amount: number }[];
  totalRevenue: number;
}) {
  return (
    <div className={rs.sectionCard}>
      <h4 className={rs.sectionTitle}>Ventas por Medio de Pago</h4>
      <table className={rs.dataTable}>
        <thead>
          <tr className={rs.dataTableHead}>
            <th className={rs.dataTableTh}>Método</th>
            <th className={`${rs.dataTableTh} ${rs.dataTableThRight}`}>Transacciones</th>
            <th className={`${rs.dataTableTh} ${rs.dataTableThRight}`}>Total</th>
            <th className={`${rs.dataTableTh} ${rs.dataTableThRight}`}>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={i} className={rs.dataTableRow}>
              <td className={`${rs.dataTableTd} ${rs.dataTableTdStrong}`}>{m.method}</td>
              <td className={`${rs.dataTableTd} ${rs.dataTableTdRight}`}>{m.count}</td>
              <td className={`${rs.dataTableTd} ${rs.dataTableTdRight} ${rs.dataTableTdBold}`}>{formatCurrency(m.amount)}</td>
              <td className={`${rs.dataTableTd} ${rs.dataTableTdMuted}`}>
                {totalRevenue > 0 ? ((m.amount / totalRevenue) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SalesReportPanel({ from, to, branchId }: Props) {
  const qc = useQueryClient();
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'pdf' | null>(null);

  const { data: summary, isLoading: sl, isError: se } = useQuery({
    queryKey: queryKeys.reports.salesSummary(from, to, branchId),
    queryFn:  () => reportsApi.getSalesSummary(from, to, branchId),
    enabled:  !!from && !!to,
  });

  const { data: topSellers, isLoading: tsl } = useQuery({
    queryKey: queryKeys.reports.topSellers(from, to, branchId),
    queryFn:  () => reportsApi.getTopSellers(from, to, branchId, 10),
    enabled:  !!from && !!to,
  });

  const { data: cogs } = useQuery({
    queryKey: queryKeys.reports.cogs(from, to, branchId),
    queryFn:  () => reportsApi.getCogs(from, to, branchId),
    enabled:  !!from && !!to,
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'csv' | 'pdf') => {
      setExportingFormat(format);
      return reportsApi.exportReport('sales', { from, to, branchId: branchId ?? '', format });
    },
    onSuccess: (data, format) => {
      const ext = format === 'pdf' ? 'pdf' : 'csv';
      const cType = format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8';
      downloadReportBlob(data.downloadUrl, `informe-ventas-${from}_${to}.${ext}`, cType);
      toast.success(format === 'pdf' ? 'PDF generado exitosamente' : 'CSV exportado exitosamente');
      setExportingFormat(null);
    },
    onError: () => {
      toast.error('Error al exportar reporte');
      setExportingFormat(null);
    },
  });

  if (sl) {
    return (
      <div className={rs.panelStack}>
        <div className="grid-responsive grid-cols-4">
          {[1, 2, 3, 4].map(i => <KpiCardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={200} />
      </div>
    );
  }

  if (se) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de ventas para el período seleccionado."
        onRetry={() => qc.invalidateQueries({ queryKey: queryKeys.reports.salesSummary(from, to, branchId) })}
      />
    );
  }

  if (!summary || summary.totalOrders === 0) {
    return (
      <div className={rs.panelStack}>
        <EmptyState
          message="No se registraron ventas en el período y sucursal seleccionados."
          icon={<ShoppingBag size={40} />}
        />
      </div>
    );
  }

  return (
    <div className={rs.panelStack}>
      {/* Botones de Exportación CSV y PDF */}
      <div className={rs.panelActions}>
        <Button
          variant="secondary"
          size="sm"
          icon={<FileText size={14} />}
          onClick={() => exportMutation.mutate('pdf')}
          loading={exportingFormat === 'pdf'}
        >
          Exportar PDF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Download size={14} />}
          onClick={() => exportMutation.mutate('csv')}
          loading={exportingFormat === 'csv'}
        >
          Exportar Excel (CSV)
        </Button>
      </div>

      {/* Tarjetas KPI Principales */}
      <div className="grid-responsive grid-cols-4">
        <KpiCard
          label="Ventas Netas"
          value={formatCurrency(summary.netRevenue)}
          subtext={`Bruto: ${formatCurrency(summary.totalRevenue)}`}
          icon={<DollarSign size={20} />}
          color="#10b981"
        />
        <KpiCard
          label="Transacciones"
          value={String(summary.totalOrders)}
          subtext="Pedidos confirmados"
          icon={<ShoppingBag size={20} />}
          color="#3b82f6"
        />
        <KpiCard
          label="Ticket Promedio"
          value={formatCurrency(summary.averageOrderValue)}
          subtext="Neto por orden"
          icon={<CreditCard size={20} />}
          color="#f59e0b"
        />
        <KpiCard
          label="Descuentos & Promos"
          value={formatCurrency(summary.totalDiscounts)}
          subtext="Total bonificado"
          icon={<TrendingUp size={20} />}
          color="#8b5cf6"
        />
      </div>

      {/* Rentabilidad y CMV */}
      {cogs && (
        <div className={rs.kpiGrid3}>
          <div className={`${rs.kpiCardBase} ${rs.kpiCardElevated}`}>
            <p className={`${rs.kpiLabel} ${rs.kpiLabelMuted}`}>Costo Mercadería Vendida (CMV)</p>
            <h3 className={rs.kpiValueMd}>{formatCurrency(cogs.totalCOGS)}</h3>
          </div>
          <div className={`${rs.kpiCardBase} ${rs.kpiCardGreen}`}>
            <p className={`${rs.kpiLabel} ${rs.kpiLabelGreen}`}>Ganancia Bruta</p>
            <h3 className={`${rs.kpiValueMd} ${rs.kpiValueGreen}`}>{formatCurrency(cogs.grossProfit)}</h3>
          </div>
          <div className={`${rs.kpiCardBase} ${rs.kpiCardBlue}`}>
            <p className={`${rs.kpiLabel} ${rs.kpiLabelBlue}`}>Margen Bruto</p>
            <h3 className={`${rs.kpiValueMd} ${rs.kpiValueBlue}`}>{cogs.grossMarginPct.toFixed(1)}%</h3>
          </div>
        </div>
      )}

      {/* Gráfico Top 10 Productos Más Vendidos con Recharts */}
      <div className={rs.sectionCard}>
        <h4 className={rs.sectionTitleLg}>Top 10 Productos más Vendidos (por unidades)</h4>
        {tsl ? (
          <ChartSkeleton height={200} />
        ) : topSellers && topSellers.length > 0 ? (
          <ResponsiveBarChart
            data={topSellers.slice(0, 10).map((t, i) => ({
              label: t.name ? (t.name.length > 18 ? t.name.slice(0, 16) + '…' : t.name) : `SKU ${t.sku}`,
              sublabel: `${t.category || 'General'} | SKU: ${t.sku}`,
              value: t.totalUnitsSold,
              color: COLORS[i % COLORS.length],
            }))}
            height={220}
            formatValue={(v) => `${v} un.`}
          />
        ) : (
          <EmptyState message="Sin datos de productos vendidos en este período." />
        )}
      </div>

      {/* Tabla de Medios de Pago */}
      {summary.byPaymentMethod && summary.byPaymentMethod.length > 0 && (
        <PaymentMethodTable rows={summary.byPaymentMethod} totalRevenue={summary.netRevenue} />
      )}
    </div>
  );
}
