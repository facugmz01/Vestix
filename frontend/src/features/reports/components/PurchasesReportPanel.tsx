import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, ShoppingBag, Truck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { KpiCard, BarChart, EmptyState, ErrorState } from './ChartPrimitives';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props { from: string; to: string; branchId?: string; }

export function PurchasesReportPanel({ from, to, branchId }: Props) {
  const qc = useQueryClient();

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: queryKeys.reports.purchasesSummary(from, to),
    queryFn:  () => reportsApi.getPurchasesSummary(from, to),
    enabled:  !!from && !!to,
  });

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.exportReport('purchases', { from, to, branchId: branchId ?? '' }),
    onSuccess:  (d) => { window.open(d.downloadUrl, '_blank'); toast.success('Exportado'); },
    onError:    () => toast.error('Error al exportar'),
  });

  if (isLoading) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos de compras...</div>;

  if (isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de compras."
        onRetry={() => qc.invalidateQueries({ queryKey: queryKeys.reports.purchasesSummary(from, to) })}
      />
    );
  }

  if (!summary) return <EmptyState message="No hay datos de compras para el período seleccionado." />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          Exportar Excel
        </Button>
      </div>

      <div className="grid-responsive grid-cols-3">
        <KpiCard label="Total Comprado" value={formatCurrency(summary.totalAmount)}    icon={<ShoppingBag  size={20} />} color="#3b82f6" />
        <KpiCard label="Monto Pagado"   value={formatCurrency(summary.totalReceived)}  icon={<Truck        size={20} />} color="#22c55e" />
        <KpiCard label="Deuda Generada" value={formatCurrency(summary.pendingAmount)}  icon={<AlertCircle  size={20} />} color="#f59e0b" />
      </div>

      {summary.topSuppliers && summary.topSuppliers.length > 0 ? (
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700 }}>Top Proveedores (por monto)</h4>
          <BarChart
            data={summary.topSuppliers.map(s => ({
              label: s.supplierName,
              value: s.totalAmount,
              color: '#3b82f6',
            }))}
            height={160}
            formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
            ariaLabel="Top proveedores por monto de compras"
          />
        </div>
      ) : (
        <EmptyState message="Sin compras registradas en el período." icon={<ShoppingBag size={32} />} />
      )}
    </div>
  );
}
