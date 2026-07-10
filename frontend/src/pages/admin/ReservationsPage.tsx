import { INVENTORY_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Package, Clock } from 'lucide-react';
import { useState } from 'react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { reservationsApi } from '@/api/reservations.api';
import { queryKeys } from '@/api/queryKeys';

import { ActionGuard } from '@/rbac/ActionGuard';

import { ReservationFormDrawer } from '@/features/inventory/reservations/components/ReservationFormDrawer';
import { ReservationDetailDrawer } from '@/features/inventory/reservations/components/ReservationDetailDrawer';
import { useListPage } from '@/hooks/useListPage';
import { formatShortId } from '@/utils/formatId';
import clsx from 'clsx';
import adminStyles from '@/styles/AdminListShared.module.css';

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa',
  CONSUMED: 'Concretada',
  RELEASED: 'Liberada',
  EXPIRED: 'Vencida',
};

export default function ReservationsPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ status: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statusFilter = filters.status;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.reservations.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => reservationsApi.getReservations({ page, pageSize, search, status: statusFilter }),
  });

  const handleCreate = () => setFormOpen(true);
  const handleView = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  const reservations = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    if (s === 'ACTIVE') return 'green';
    if (s === 'CONSUMED') return 'blue';
    if (s === 'EXPIRED') return 'red';
    return 'gray';
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt).getTime() < new Date().getTime();
  };

  return (
    <PageContainer
      tabs={<Tabs items={INVENTORY_TABS} />}
      
      title="Reservas de Stock" 
      subtitle="Monitor de mercadería retenida y apartada temporalmente para clientes."
      action={
        <ActionGuard action="manage" subject="Inventory">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Reserva
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} registros</Badge>}>
        <SearchInput placeholder="Buscar por ID..." onSearch={setSearch} />
        
        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} className={adminStyles.filterSelect}>
          <option value="">Todas</option>
          <option value="ACTIVE">Activas (Reteniendo Stock)</option>
          <option value="CONSUMED">Concretadas (Vendidas)</option>
          <option value="RELEASED">Liberadas</option>
          <option value="EXPIRED">Vencidas</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : reservations.length === 0 ? (
          <EmptyState 
            icon={<Package size={40} />}
            title="Sin Reservas" 
            message="No hay mercadería apartada con los filtros activos." 
          />
        ) : (
          <Table
            keyField="id"
            data={reservations}
            columns={[
              { 
                key: 'id', 
                header: 'Reserva ID',
                render: (r) => <span className={adminStyles.cellMonoBold}>{formatShortId(r.id)}</span>
              },
              { 
                key: 'customer', 
                header: 'Cliente',
                render: (r) => <span className={adminStyles.cellMedium}>{r.customerName || 'CF'}</span>
              },
              { 
                key: 'expires', 
                header: 'Vencimiento',
                render: (r) => {
                  if (r.status !== 'ACTIVE') return <span className={adminStyles.expiryMuted}>-</span>;
                  const expiredLocally = isExpired(r.expiresAt);
                  return (
                    <div className={clsx(adminStyles.expiryRow, expiredLocally ? adminStyles.expiryOverdue : adminStyles.expiryNormal)}>
                      <Clock size={14} />
                      {new Date(r.expiresAt).toLocaleString()}
                    </div>
                  );
                }
              },
              { 
                key: 'items', 
                header: 'Artículos',
                render: (r) => <Badge color="gray">{r.lines.length} Refs</Badge>
              },
              { 
                key: 'status', 
                header: 'Estado',
                render: (r) => <StatusChip label={RESERVATION_STATUS_LABELS[r.status] || r.status} color={getStatusColor(r.status) as any} />
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div className={adminStyles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(r.id)} aria-label="Ver y Gestionar">
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

      <ReservationFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
      />
      
      <ReservationDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        reservationId={selectedId} 
      />

    </PageContainer>
  );
}
