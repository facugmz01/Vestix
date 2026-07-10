import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, TrendingUp, ShoppingBag, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { BarChart, KpiCard, EmptyState, ErrorState } from './ChartPrimitives';
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

  const { data: summary, isLoading: sl, isError: se } = useQuery({
    queryKey: queryKeys.reports.salesSummary(from, to, branchId),
    queryFn:  () => reportsApi.getSalesSummary(from, to, branchId),
    enabled:  !!from && !!to,
  });

  const { data: topSellers, isLoading: tsl } = useQuery({
    queryKey: queryKeys.reports.topSellers(from, to),
    queryFn:  () => reportsApi.getTopSellers(from, to, 10),
    enabled:  !!from && !!to,
  });

  const { data: cogs } = useQuery({
    queryKey: queryKeys.reports.cogs(from, to),
    queryFn:  () => reportsApi.getCogs(from, to),
    enabled:  !!from && !!to,
  });

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.exportReport('sales', { from, to, branchId: branchId ?? '' }),
    onSuccess:  (data) => { window.open(data.downloadUrl, '_blank'); toast.success('Reporte exportado'); },
    onError:    () => toast.error('Error al exportar'),
  });

  if (sl) return <div className={rs.loadingState}>Cargando datos de ventas...</div>;

  if (se) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de ventas."
        onRetry={() => qc.invalidateQueries({ queryKey: queryKeys.reports.salesSummary(from, to, branchId) })}
      />
    );
  }

  if (!summary) return <EmptyState message="No hay datos de ventas para el período seleccionado." />;

  return (
    <div className={rs.panelStack}>
      <div className={rs.panelActions}>
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          Exportar Excel
        </Button>
      </div>

      <div className="grid-responsive grid-cols-4">
        <KpiCard label="Total Facturado"  value={formatCurrency(summary.totalRevenue)}      icon={<TrendingUp  size={20} />} color="#3b82f6" />
        <KpiCard label="Transacciones"    value={String(summary.totalOrders)}               icon={<ShoppingBag size={20} />} color="#10b981" />
        <KpiCard label="Ticket Promedio"  value={formatCurrency(summary.averageOrderValue)} icon={<CreditCard  size={20} />} color="#f59e0b" />
        <KpiCard label="Descuentos"       value={formatCurrency(summary.totalDiscounts)}    icon={<TrendingUp  size={20} />} color="#8b5cf6" />
      </div>

      {cogs && (
        <div className={rs.kpiGrid3}>
          <div className={`${rs.kpiCardBase} ${rs.kpiCardElevated}`}>
            <p className={`${rs.kpiLabel} ${rs.kpiLabelMuted}`}>CMV</p>
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

      {!tsl && topSellers && topSellers.length > 0 && (
        <div className={rs.sectionCard}>
          <h4 className={rs.sectionTitleLg}>Top 10 Productos más Vendidos</h4>
          <BarChart
            data={topSellers.slice(0, 10).map((t, i) => ({
              label: t.name?.split(' ').slice(0, 2).join(' ') ?? `SKU ${i + 1}`,
              value: t.totalUnitsSold,
              color: COLORS[i % COLORS.length],
            }))}
            height={180}
            formatValue={(v) => String(v)}
            ariaLabel="Top 10 productos más vendidos"
          />
        </div>
      )}

      {summary.byPaymentMethod && summary.byPaymentMethod.length > 0 && (
        <PaymentMethodTable rows={summary.byPaymentMethod} totalRevenue={summary.totalRevenue} />
      )}
    </div>
  );
}
