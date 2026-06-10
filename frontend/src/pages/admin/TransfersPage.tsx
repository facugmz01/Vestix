import { useState , Tabs } from 'react';
import { INVENTORY_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Truck, Navigation } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, StatusChip
} from '@/components/ui';

import { transfersApi } from '@/api/transfers.api';
import { queryKeys } from '@/api/queryKeys';

import { ActionGuard } from '@/rbac/ActionGuard';

import { TransferFormDrawer } from '@/features/inventory/transfers/components/TransferFormDrawer';
import { TransferDetailDrawer } from '@/features/inventory/transfers/components/TransferDetailDrawer';

export default function TransfersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.transfers.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => transfersApi.getTransfers({ page, pageSize, search, status: statusFilter }),
  });

  const handleCreate = () => {
    setFormOpen(true);
  };

  const handleView = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const transfersList = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'gray';
      case 'IN_TRANSIT': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'Borrador / Preparación';
      case 'IN_TRANSIT': return 'En Tránsito';
      case 'COMPLETED': return 'Recibida Completada';
      case 'CANCELLED': return 'Cancelada';
      default: return s;
    }
  };

  return (
    <PageContainer
      tabs={<Tabs items={INVENTORY_TABS} />}
      
      title="Transferencias Internas" 
      subtitle="Gestioná los envíos de mercadería entre depósitos y sucursales (Remitos internos)."
      action={
        <ActionGuard action="manage" subject="Inventory">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Solicitud
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} transferencias</Badge>}>
        <SearchInput placeholder="Buscar por ID o Tracking..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="DRAFT">Preparación (DRAFT)</option>
          <option value="IN_TRANSIT">En Tránsito (IN_TRANSIT)</option>
          <option value="COMPLETED">Completadas (COMPLETED)</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : transfersList.length === 0 ? (
          <EmptyState 
            icon={<Navigation size={40} />}
            title="Sin Transferencias" 
            message="No hay registros de movimientos entre depósitos." 
          />
        ) : (
          <Table
            keyField="id"
            data={transfersList}
            columns={[
              { 
                key: 'id', 
                header: 'Remito ID',
                render: (t) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{t.id.split('-')[0]}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha Creación',
                render: (t) => <span style={{ fontSize: '13px' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'route', 
                header: 'Ruta Logística',
                render: (t) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Desde: <strong style={{ color: 'var(--text-primary)'}}>{t.sourceWarehouseName}</strong></span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hacia: <strong style={{ color: 'var(--text-primary)'}}>{t.destinationWarehouseName}</strong></span>
                  </div>
                )
              },
              { 
                key: 'lines', 
                header: 'Líneas',
                render: (t) => <Badge color="gray">{t.lines.length} items</Badge>
              },
              { 
                key: 'status', 
                header: 'Estado',
                render: (t) => <StatusChip label={getStatusLabel(t.status)} color={getStatusColor(t.status) as any} />
              },
              {
                key: 'actions',
                header: '',
                render: (t) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(t.id)} aria-label="Gestionar" title="Ver detalle o Gestionar recepción">
                      {t.status === 'IN_TRANSIT' ? <Truck size={16} color="var(--blue)" /> : <Eye size={16} />}
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <TransferFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
      />
      
      <TransferDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        transferId={selectedId} 
      />

    </PageContainer>
  );
}
