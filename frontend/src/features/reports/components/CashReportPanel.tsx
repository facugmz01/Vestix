import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { KpiCard, BarChart, StackedBar, EmptyState, ErrorState } from './ChartPrimitives';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props { from: string; to: string; branchId?: string; }

const METHOD_COLORS: Record<string, string> = {
  CASH:          '#22c55e',
  CREDIT_CARD:   '#3b82f6',
  DEBIT_CARD:    '#8b5cf6',
  BANK_TRANSFER: '#f59e0b',
  STORE_CREDIT:  '#06b6d4',
};

export function CashReportPanel({ from, to, branchId }: Props) {
  const qc = useQueryClient();

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: queryKeys.reports.cashSummary(from, to, branchId),
    queryFn:  () => reportsApi.getCashSummary(from, to, branchId),
    enabled:  !!from && !!to,
  });

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.exportReport('cash', { from, to, branchId: branchId ?? '' }),
    onSuccess:  (d) => { window.open(d.downloadUrl, '_blank'); toast.success('Exportado'); },
    onError:    () => toast.error('Error al exportar'),
  });

  if (isLoading) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos de caja...</div>;

  if (isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de caja."
        onRetry={() => qc.invalidateQueries({ queryKey: queryKeys.reports.cashSummary(from, to, branchId) })}
      />
    );
  }

  if (!summary) return <EmptyState message="No hay datos de caja para el período seleccionado." />;

  const dailySeries = summary.dailySeries ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          Exportar Excel
        </Button>
      </div>

      <div className="grid-responsive grid-cols-3">
        <KpiCard label="Total Ingresos"       value={formatCurrency(summary.totalIncome)}   icon={<Wallet size={20} />} color="#22c55e" />
        <KpiCard label="Total Egresos"        value={formatCurrency(summary.totalExpenses)} icon={<Wallet size={20} />} color="#ef4444" />
        <KpiCard
          label="Resultado Neto de Caja"
          value={formatCurrency(summary.netCash)}
          icon={<Wallet size={20} />}
          color={summary.netCash >= 0 ? '#3b82f6' : '#ef4444'}
        />
      </div>

      {summary.byMethod && summary.byMethod.length > 0 && (
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700 }}>Distribución por Medio de Cobro</h4>
          <StackedBar
            segments={summary.byMethod.map(m => ({
              label: m.method,
              value: m.amount,
              color: METHOD_COLORS[m.method] ?? '#94a3b8',
            }))}
            total={summary.totalIncome}
            formatValue={formatCurrency}
          />
        </div>
      )}

      {dailySeries.length > 0 && (
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700 }}>Evolución Diaria de Caja (Ingresos)</h4>
          <BarChart
            data={dailySeries.map(d => ({
              label: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
              value: d.income,
              color: '#22c55e',
            }))}
            height={160}
            formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
            ariaLabel="Evolución diaria de ingresos de caja"
          />
        </div>
      )}
    </div>
  );
}
