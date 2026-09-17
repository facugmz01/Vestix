import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, ShoppingBag, Truck, AlertCircle } from 'lucide-react';
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

export function PurchasesReportPanel({ from, to, branchId }: Props) {
  const qc = useQueryClient();

  const { data: summary, isLoading, isError } = useQuery({
    queryKey: queryKeys.reports.purchasesSummary(from, to, branchId),
    queryFn:  () => reportsApi.getPurchasesSummary(from, to, branchId),
    enabled:  !!from && !!to,
  });

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.exportReport('purchases', { from, to, branchId: branchId ?? '' }),
    onSuccess:  (d) => {
      downloadReportBlob(d.downloadUrl, `informe-compras-${from}_${to}.csv`, 'text/csv; charset=utf-8');
      toast.success('Reporte de compras exportado');
    },
    onError:    () => toast.error('Error al exportar'),
  });

  if (isLoading) {
    return (
      <div className={rs.panelStack}>
        <div className="grid-responsive grid-cols-3">
          {[1, 2, 3].map(i => <KpiCardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={200} />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos de compras."
        onRetry={() => qc.invalidateQueries({ queryKey: queryKeys.reports.purchasesSummary(from, to, branchId) })}
      />
    );
  }

  if (!summary || summary.totalOrders === 0) {
    return (
      <div className={rs.panelStack}>
        <EmptyState message="No hay compras registradas en el período y sucursal seleccionados." icon={<ShoppingBag size={36} />} />
      </div>
    );
  }

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
        <KpiCard label="Total Comprado" value={formatCurrency(summary.totalAmount)}   icon={<ShoppingBag size={20} />} color="#3b82f6" />
        <KpiCard label="Monto Pagado"   value={formatCurrency(summary.totalReceived)} icon={<Truck size={20} />}       color="#22c55e" />
        <KpiCard label="Deuda Pendiente" value={formatCurrency(summary.pendingAmount)} icon={<AlertCircle size={20} />} color="#f59e0b" />
      </div>

      {summary.topSuppliers && summary.topSuppliers.length > 0 ? (
        <div className={rs.sectionCard}>
          <h4 className={rs.sectionTitleLg}>Top Proveedores (por monto de compra)</h4>
          <ResponsiveBarChart
            data={summary.topSuppliers.map(s => ({
              label: s.supplierName.length > 20 ? s.supplierName.slice(0, 18) + '…' : s.supplierName,
              sublabel: s.supplierName,
              value: s.totalAmount,
              color: '#3b82f6',
            }))}
            height={220}
            formatValue={(v) => formatCurrency(v)}
          />
        </div>
      ) : (
        <EmptyState message="Sin proveedores con compras registradas en el período." icon={<ShoppingBag size={32} />} />
      )}
    </div>
  );
}
