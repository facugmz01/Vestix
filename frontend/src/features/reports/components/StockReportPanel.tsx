import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, AlertTriangle, Package } from 'lucide-react';
import { useMutation as useMut } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, Table, Badge } from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { KpiCard, BarChart } from './ChartPrimitives';

interface Props { branchId?: string; from: string; to: string; }

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function StockReportPanel({ branchId }: Omit<Props, 'from' | 'to'>) {
  const fmtCurrency = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  const { data: valuation, isLoading: vl } = useQuery({
    queryKey: queryKeys.reports.stockValuation(branchId),
    queryFn: () => reportsApi.getStockValuation(branchId),
  });

  const { data: lowStock, isLoading: ll } = useQuery({
    queryKey: queryKeys.reports.lowStock(branchId),
    queryFn: () => reportsApi.getLowStockAlerts(branchId),
  });

  const exportMutation = useMut({
    mutationFn: () => reportsApi.exportReport('stock', { branchId: branchId ?? '' }),
    onSuccess: (d) => { window.open(d.downloadUrl, '_blank'); toast.success('Reporte exportado'); },
    onError: () => toast.error('Error al exportar'),
  });

  if (vl) return <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos de stock...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>Exportar Excel</Button>
      </div>

      {valuation && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <KpiCard label="SKUs Únicos" value={String(valuation.totalSKUs)} icon={<Package size={20} />} color="#3b82f6" />
            <KpiCard label="Unidades en Stock" value={String(valuation.totalUnits)} icon={<Package size={20} />} color="#10b981" />
            <KpiCard label="Valor al Costo" value={fmtCurrency(valuation.totalValueAtCost)} icon={<Package size={20} />} color="#f59e0b" />
            <KpiCard label="Margen Potencial" value={`${valuation.totalValueAtRetail > 0 ? (((valuation.totalValueAtRetail - valuation.totalValueAtCost) / valuation.totalValueAtRetail) * 100).toFixed(1) : 0}%`} icon={<Package size={20} />} color="#8b5cf6" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Valor Venta Potencial</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{fmtCurrency(valuation.totalValueAtRetail)}</h3>
            </div>
            <div style={{ padding: '20px', background: 'var(--green-bg)', border: '1px solid var(--green)', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--green)', textTransform: 'uppercase' }}>Margen Bruto Potencial</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--green)' }}>{fmtCurrency(valuation.potentialMargin)}</h3>
            </div>
          </div>
        </>
      )}

      {/* Low Stock Alerts */}
      <div style={{ background: 'var(--bg-base)', border: ll || !lowStock || lowStock.length === 0 ? '1px solid var(--border)' : '1px solid var(--orange)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--orange)" /> Alertas de Stock Bajo
          </h4>
          {lowStock && lowStock.length > 0 && <Badge color="orange">{lowStock.length} artículos</Badge>}
        </div>

        {ll ? (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</p>
        ) : !lowStock || lowStock.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>✓ Sin alertas de stock bajo.</p>
        ) : (
          <Table
            keyField="variantId"
            data={lowStock}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.sku}</span> },
              { key: 'product', header: 'Producto', render: (l) => <span>{l.productName}</span> },
              { key: 'branch', header: 'Sucursal', render: (l) => <Badge color="gray">{l.branchName}</Badge> },
              { key: 'stock', header: 'Stock Actual', render: (l) => <span style={{ fontWeight: 800, color: l.currentStock <= 0 ? 'var(--red)' : 'var(--orange)' }}>{l.currentStock}</span> },
              { key: 'reorder', header: 'Punto Reorden', render: (l) => <span style={{ color: 'var(--text-muted)' }}>{l.reorderPoint}</span> },
            ]}
          />
        )}
      </div>
    </div>
  );
}
