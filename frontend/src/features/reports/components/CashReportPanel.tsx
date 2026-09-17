import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import {
  KpiCard,
  KpiCardSkeleton,
  ChartSkeleton,
  ResponsiveAreaChart,
  StackedBar,
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
    onSuccess:  (d) => {
      downloadReportBlob(d.downloadUrl, `informe-caja-${from}_${to}.csv`, 'text/csv; charset=utf-8');
      toast.success('Reporte de caja exportado');
    },
    onError:    () => toast.error('Error al exportar'),
  });

  if (isLoading) {
    return (
      <div className={rs.panelStack}>
        <div className="grid-responsive grid-cols-3">
          {[1, 2, 3].map(i => <KpiCardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={220} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de tesorería y caja."
        onRetry={() => qc.invalidateQueries({ queryKey: queryKeys.reports.cashSummary(from, to, branchId) })}
      />
    );
  }

  if (!summary || (summary.totalIncome === 0 && summary.totalExpenses === 0)) {
    return (
      <div className={rs.panelStack}>
        <EmptyState message="No hay movimientos de caja en el período y sucursal seleccionados." icon={<Wallet size={36} />} />
      </div>
    );
  }

  const dailySeries = summary.dailySeries ?? [];

  return (
    <div className={rs.panelStack}>
      <div className={rs.panelActions}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Download size={14} />}
          onClick={() => exportMutation.mutate()}
          loading={exportMutation.isPending}
        >
          Exportar Excel (CSV)
        </Button>
      </div>

      <div className="grid-responsive grid-cols-3">
        <KpiCard label="Total Ingresos" value={formatCurrency(summary.totalIncome)} icon={<Wallet size={20} />} color="#22c55e" />
        <KpiCard label="Total Egresos"  value={formatCurrency(summary.totalExpenses)} icon={<Wallet size={20} />} color="#ef4444" />
        <KpiCard
          label="Resultado Neto de Caja"
          value={formatCurrency(summary.netCash)}
          icon={<Wallet size={20} />}
          color={summary.netCash >= 0 ? '#3b82f6' : '#ef4444'}
        />
      </div>

      {summary.byMethod && summary.byMethod.length > 0 && (
        <div className={rs.sectionCard}>
          <h4 className={rs.sectionTitle}>Distribución por Medio de Cobro</h4>
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
        <div className={rs.sectionCard}>
          <h4 className={rs.sectionTitleLg}>Evolución Diaria de Caja (Ingresos vs Egresos)</h4>
          <ResponsiveAreaChart
            data={dailySeries.map(d => ({
              date: d.date.slice(5), // MM-DD
              value: d.income,
              secondaryValue: d.expenses,
            }))}
            height={220}
            label="Ingresos"
            secondaryLabel="Egresos"
            color="#22c55e"
            secondaryColor="#ef4444"
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      )}
    </div>
  );
}
