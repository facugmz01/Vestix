import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Download, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button, Table, Badge } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { KpiCard, EmptyState, ErrorState } from './ChartPrimitives';
import { formatCurrency } from '@/utils/formatCurrency';

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
    return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos de stock...</div>;
  }

  if (ve) {
    return <ErrorState message="No se pudo cargar la valoración de stock." onRetry={retryValuation} />;
  }

  const potentialMarginPct = valuation && valuation.totalValueAtRetail > 0
    ? (((valuation.totalValueAtRetail - valuation.totalValueAtCost) / valuation.totalValueAtRetail) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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

          <div className="grid-responsive grid-cols-2">
            <div style={{ padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor Venta Potencial</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{formatCurrency(valuation.totalValueAtRetail)}</h3>
            </div>
            <div style={{ padding: '20px', background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--green)', textTransform: 'uppercase' }}>Ganancia Potencial</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--green)' }}>
                {formatCurrency(valuation.totalValueAtRetail - valuation.totalValueAtCost)}
              </h3>
            </div>
          </div>
        </>
      )}

      {/* Low Stock Alerts */}
      <div style={{
        background: 'var(--bg-base)',
        border: `1px solid ${(lowStock?.length ?? 0) > 0 ? 'var(--orange)' : 'var(--border)'}`,
        borderRadius: '12px', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--orange)" /> Alertas de Stock Bajo
          </h4>
          {lowStock && lowStock.length > 0 && <Badge color="yellow">{lowStock.length} artículos</Badge>}
        </div>

        {ll ? (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</p>
        ) : le ? (
          <div style={{ padding: '16px' }}>
            <ErrorState message="Error al cargar las alertas de stock." onRetry={retryLowStock} />
          </div>
        ) : !lowStock || lowStock.length === 0 ? (
          <EmptyState message="✓ Sin alertas de stock bajo." />
        ) : (
          <Table
            keyField="variantId"
            data={lowStock}
            columns={[
              { key: 'sku',     header: 'SKU',          render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.sku}</span> },
              { key: 'product', header: 'Producto',     render: (l) => <span>{l.name}</span> },
              { key: 'branch',  header: 'Sucursal',     render: (l) => <Badge color="gray">{l.branchId}</Badge> },
              { key: 'stock',   header: 'Stock Actual', render: (l) => <span style={{ fontWeight: 800, color: l.availableQuantity <= 0 ? 'var(--red)' : 'var(--orange)' }}>{l.availableQuantity}</span> },
              { key: 'reorder', header: 'Punto Reorden', render: (l) => <span style={{ color: 'var(--text-muted)' }}>{l.reorderPoint}</span> },
            ]}
          />
        )}
      </div>
    </div>
  );
}
