import { SALES_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, ArrowRightLeft } from 'lucide-react';
import { useState } from 'react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { returnsApi } from '@/api/returns.api';
import { queryKeys } from '@/api/queryKeys';

import { ActionGuard } from '@/rbac/ActionGuard';

import { ReturnFormDrawer } from '@/features/sales/returns/components/ReturnFormDrawer';
import { ReturnDetailDrawer } from '@/features/sales/returns/components/ReturnDetailDrawer';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';

export default function ReturnsPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ status: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statusFilter = filters.status;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.returns.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => returnsApi.getReturns({ page, pageSize, search, status: statusFilter }),
  });

  const handleCreate = () => setFormOpen(true);
  const handleView = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  const returns = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    if (s === 'PENDING') return 'orange';
    if (s === 'APPROVED') return 'green';
    return 'red';
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'PENDING': return 'Pendiente';
      case 'APPROVED': return 'Aprobado';
      case 'REJECTED': return 'Rechazado';
      default: return s;
    }
  };

  const getActionColor = (a: string) => {
    if (a === 'REFUND') return 'blue';
    if (a === 'EXCHANGE') return 'purple';
    return 'gray';
  };

  const getActionLabel = (a: string) => {
    switch (a) {
      case 'REFUND': return 'Reembolso';
      case 'EXCHANGE': return 'Cambio';
      case 'STORE_CREDIT': return 'Crédito';
      default: return a;
    }
  };

  return (
    <PageContainer
      tabs={<Tabs items={SALES_TABS} />}
      
      title="Gestión de Devoluciones y Cambios" 
      subtitle="Autorización de notas de crédito, retornos de mercadería y cambios de producto (RMA)."
      action={
        <ActionGuard action="manage" subject="Sales">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Solicitud (RMA)
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} registros</Badge>}>
        <SearchInput placeholder="Buscar por ID de Solicitud o Ticket..." onSearch={setSearch} />
        
        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="PENDING">Pendiente de Aprobación</option>
          <option value="APPROVED">Aprobados / Completados</option>
          <option value="REJECTED">Rechazados</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : returns.length === 0 ? (
          <EmptyState 
            icon={<ArrowRightLeft size={40} />}
            title="Sin Devoluciones" 
            message="No se encontraron registros de RMA con los filtros activos." 
          />
        ) : (
          <Table
            keyField="id"
            data={returns}
            columns={[
              { 
                key: 'id', 
                header: 'RMA ID',
                render: (r) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.id.split('-')[0]}</span>
              },
              { 
                key: 'ticket', 
                header: 'Venta Original',
                render: (r) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.saleOrderId.split('-')[0]}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha',
                render: (r) => <span style={{ fontSize: '13px' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'action', 
                header: 'Tipo',
                render: (r) => <Badge color={getActionColor(r.action)}>{getActionLabel(r.action)}</Badge>
              },
              { 
                key: 'total', 
                header: 'Monto a Favor',
                render: (r) => <span style={{ fontWeight: 900, fontSize: '15px' }}>{formatCurrency(r.totalRefundAmount)}</span>
              },
              { 
                key: 'status', 
                header: 'Auditoría',
                render: (r) => <StatusChip label={getStatusLabel(r.status)} color={getStatusColor(r.status) as any} />
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(r.id)} aria-label="Ver / Auditar">
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

      <ReturnFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
      />
      
      <ReturnDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        returnId={selectedId} 
      />

    </PageContainer>
  );
}
