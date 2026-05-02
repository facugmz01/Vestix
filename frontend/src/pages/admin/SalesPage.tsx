import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, ShoppingCart, Calculator, Monitor } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, StatusChip
} from '@/components/ui';

import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import type { SaleOrder } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { SaleFormDrawer } from '@/features/sales/components/SaleFormDrawer';
import { SaleDetailDrawer } from '@/features/sales/components/SaleDetailDrawer';

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.sales.all({ page, pageSize, search, status: statusFilter }), // Ideally backend filters source too
    queryFn: () => salesApi.getSales({ page, pageSize, search, status: statusFilter }),
  });

  const handleCreate = () => setFormOpen(true);
  const handleView = (id: string) => { setSelectedSaleId(id); setDetailOpen(true); };

  const sales = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'QUOTATION': return 'orange';
      case 'CONFIRMED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <PageContainer 
      title="Operaciones de Venta (Backoffice)" 
      subtitle="Monitor general de ventas confirmadas y presupuestos (Quotations) generados en todas las sucursales."
      action={
        <ActionGuard action="manage" subject="Sales">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Crear Presupuesto / Venta
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} documentos</Badge>}>
        <SearchInput placeholder="Buscar por ID de Venta..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="QUOTATION">Solo Presupuestos</option>
          <option value="CONFIRMED">Ventas Confirmadas</option>
          <option value="CANCELLED">Canceladas / Rechazadas</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : sales.length === 0 ? (
          <EmptyState 
            icon={<ShoppingCart size={40} />}
            title="Sin Ventas" 
            message="No hay registros comerciales con los filtros indicados." 
          />
        ) : (
          <Table
            keyField="id"
            data={sales}
            columns={[
              { 
                key: 'id', 
                header: 'Doc ID',
                render: (s) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.id.split('-')[0]}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha',
                render: (s) => <span style={{ fontSize: '13px' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'source', 
                header: 'Canal',
                render: (s) => (
                  <Badge color="gray" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {s.source === 'POS' ? <Monitor size={12} /> : s.source === 'ECOMMERCE' ? <ShoppingCart size={12} /> : <Calculator size={12} />}
                    {s.source}
                  </Badge>
                )
              },
              { 
                key: 'customer', 
                header: 'Cliente',
                render: (s) => <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.customerName || 'Consumidor Final'}</span>
              },
              { 
                key: 'total', 
                header: 'Monto Final',
                render: (s) => <span style={{ fontWeight: 900, fontSize: '15px' }}>{fmtCurrency(s.grandTotal)}</span>
              },
              { 
                key: 'status', 
                header: 'Estado Comercial',
                render: (s) => <StatusChip label={s.status === 'QUOTATION' ? 'Presupuesto' : s.status} color={getStatusColor(s.status) as any} />
              },
              {
                key: 'actions',
                header: '',
                render: (s) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(s.id)} aria-label="Ver Detalles" title="Abrir Visor Comercial">
                      <Eye size={16} />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <SaleFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
      />
      
      <SaleDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        saleId={selectedSaleId} 
      />

    </PageContainer>
  );
}
