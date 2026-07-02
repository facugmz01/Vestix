import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, TrendingUp, ShoppingBag, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { BarChart, KpiCard, EmptyState, ErrorState } from './ChartPrimitives';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  from: string;
  to: string;
  branchId?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// ─── PaymentMethodTable ───────────────────────────────────────────────────────

function PaymentMethodTable({
  rows,
  totalRevenue,
}: {
  rows: { method: string; count: number; amount: number }[];
  totalRevenue: number;
}) {
  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700 }}>Ventas por Medio de Pago</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Método</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Transacciones</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
            <th style={{ padding: '8px', textAlign: 'right' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 8px', fontWeight: 600 }}>{m.method}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>{m.count}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(m.amount)}</td>
              <td style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--text-muted)' }}>
                {totalRevenue > 0 ? ((m.amount / totalRevenue) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── SalesReportPanel ─────────────────────────────────────────────────────────

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

  if (sl) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos de ventas...</div>;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          Exportar Excel
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid-responsive grid-cols-4">
        <KpiCard label="Total Facturado"  value={formatCurrency(summary.totalRevenue)}      icon={<TrendingUp  size={20} />} color="#3b82f6" />
        <KpiCard label="Transacciones"    value={String(summary.totalOrders)}               icon={<ShoppingBag size={20} />} color="#10b981" />
        <KpiCard label="Ticket Promedio"  value={formatCurrency(summary.averageOrderValue)} icon={<CreditCard  size={20} />} color="#f59e0b" />
        <KpiCard label="Descuentos"       value={formatCurrency(summary.totalDiscounts)}    icon={<TrendingUp  size={20} />} color="#8b5cf6" />
      </div>

      {/* COGS */}
      {cogs && (
        <div className="grid-responsive grid-cols-3">
          <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CMV</p>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{formatCurrency(cogs.totalCOGS)}</h3>
          </div>
          <div style={{ padding: '20px', background: 'var(--green-bg)', borderRadius: '12px', border: '1px solid var(--green)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--green)', textTransform: 'uppercase', fontWeight: 600 }}>Ganancia Bruta</p>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'var(--green)' }}>{formatCurrency(cogs.grossProfit)}</h3>
          </div>
          <div style={{ padding: '20px', background: 'var(--blue-bg)', borderRadius: '12px', border: '1px solid var(--blue)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--blue)', textTransform: 'uppercase', fontWeight: 600 }}>Margen Bruto</p>
            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: 'var(--blue)' }}>{cogs.grossMarginPct.toFixed(1)}%</h3>
          </div>
        </div>
      )}

      {/* Top Sellers */}
      {!tsl && topSellers && topSellers.length > 0 && (
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700 }}>Top 10 Productos más Vendidos</h4>
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

      {/* Payment methods */}
      {summary.byPaymentMethod && summary.byPaymentMethod.length > 0 && (
        <PaymentMethodTable rows={summary.byPaymentMethod} totalRevenue={summary.totalRevenue} />
      )}
    </div>
  );
}
