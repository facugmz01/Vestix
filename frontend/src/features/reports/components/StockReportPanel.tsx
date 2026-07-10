import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, AlertTriangle, Package } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import { Button, Table, Badge } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { KpiCard, EmptyState, ErrorState } from './ChartPrimitives';
import { formatCurrency } from '@/utils/formatCurrency';
import rs from '@/styles/ReportsShared.module.css';

interface Props {
  branchId?: string;
}

export function StockReportPanel({ branchId }: Props) {
  const qc = useQueryClient();

  const { data: valuation, isLoading: vl, isError: ve } = useQuery({
    queryKey: queryKeys.reports.stockValuation(branchId),
    queryFn:  () => reportsApi.getStockValuation(branchId),
  });

  const { data: lowStock, isLoading: ll, isError: le } = useQuery({
    queryKey: queryKeys.reports.lowStock(branchId),
    queryFn:  () => reportsApi.getLowStockAlerts(branchId),
  });

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.exportReport('stock', { branchId: branchId ?? '' }),
    onSuccess:  (d) => { window.open(d.downloadUrl, '_blank'); toast.success('Reporte exportado'); },
    onError:    () => toast.error('Error al exportar'),
  });

  const retryValuation = () => qc.invalidateQueries({ queryKey: queryKeys.reports.stockValuation(branchId) });
  const retryLowStock  = () => qc.invalidateQueries({ queryKey: queryKeys.reports.lowStock(branchId) });

  if (vl) {
    return <div className={rs.loadingState}>Cargando datos de stock...</div>;
  }

  if (ve) {
    return <ErrorState message="No se pudo cargar la valoración de stock." onRetry={retryValuation} />;
  }

  const potentialMarginPct = valuation && valuation.totalValueAtRetail > 0
    ? (((valuation.totalValueAtRetail - valuation.totalValueAtCost) / valuation.totalValueAtRetail) * 100).toFixed(1)
    : '0';

  const hasLowStock = (lowStock?.length ?? 0) > 0;

  return (
    <div className={rs.panelStack}>
      <div className={rs.panelActions}>
        <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
          Exportar Excel
        </Button>
      </div>

      {valuation && (
        <>
          <div className="grid-responsive grid-cols-4">
            <KpiCard label="SKUs Únicos"          value={String(valuation.totalSKUs)}               icon={<Package size={20} />} color="#3b82f6" />
            <KpiCard label="Unidades en Stock"    value={String(valuation.totalUnits)}              icon={<Package size={20} />} color="#10b981" />
            <KpiCard label="Valor al Costo"       value={formatCurrency(valuation.totalValueAtCost)} icon={<Package size={20} />} color="#f59e0b" />
            <KpiCard label="Margen Potencial"     value={`${potentialMarginPct}%`}                 icon={<Package size={20} />} color="#8b5cf6" />
          </div>

          <div className={rs.kpiGrid2}>
            <div className={`${rs.kpiCardBase} ${rs.kpiCardNeutral}`}>
              <p className={`${rs.kpiLabel} ${rs.kpiLabelMuted}`}>Valor Venta Potencial</p>
              <h3 className={rs.kpiValue}>{formatCurrency(valuation.totalValueAtRetail)}</h3>
            </div>
            <div className={`${rs.kpiCardBase} ${rs.kpiCardGreen}`}>
              <p className={`${rs.kpiLabel} ${rs.kpiLabelGreen}`}>Ganancia Potencial</p>
              <h3 className={`${rs.kpiValue} ${rs.kpiValueGreen}`}>
                {formatCurrency(valuation.totalValueAtRetail - valuation.totalValueAtCost)}
              </h3>
            </div>
          </div>
        </>
      )}

      <div className={clsx(rs.tableCard, hasLowStock && rs.tableCardAlert)}>
        <div className={rs.tableCardHeader}>
          <h4 className={rs.sectionTitleRow}>
            <AlertTriangle size={16} color="var(--orange)" /> Alertas de Stock Bajo
          </h4>
          {lowStock && lowStock.length > 0 && <Badge color="yellow">{lowStock.length} artículos</Badge>}
        </div>

        {ll ? (
          <p className={rs.tableCardLoading}>Cargando...</p>
        ) : le ? (
          <div className={rs.tableCardBody}>
            <ErrorState message="Error al cargar las alertas de stock." onRetry={retryLowStock} />
          </div>
        ) : !lowStock || lowStock.length === 0 ? (
          <EmptyState message="✓ Sin alertas de stock bajo." />
        ) : (
          <Table
            keyField="variantId"
            data={lowStock}
            columns={[
              { key: 'sku',     header: 'SKU',          render: (l) => <span className={rs.monoBold}>{l.sku}</span> },
              { key: 'product', header: 'Producto',     render: (l) => <span>{l.name}</span> },
              { key: 'branch',  header: 'Sucursal',     render: (l) => <Badge color="gray">{l.branchId}</Badge> },
              { key: 'stock',   header: 'Stock Actual', render: (l) => <span className={l.availableQuantity <= 0 ? rs.stockLow : rs.stockWarn}>{l.availableQuantity}</span> },
              { key: 'reorder', header: 'Punto Reorden', render: (l) => <span className={rs.textMuted}>{l.reorderPoint}</span> },
            ]}
          />
        )}
      </div>
    </div>
  );
}
