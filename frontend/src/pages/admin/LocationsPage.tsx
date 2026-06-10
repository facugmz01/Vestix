import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Map } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip, Tabs
} from '@/components/ui';

import { locationsApi } from '@/api/locations.api';
import { queryKeys } from '@/api/queryKeys';
import type { StorageLocation } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { LocationFormDrawer } from '@/features/locations/components/LocationFormDrawer';
import { LocationDetailDrawer } from '@/features/locations/components/LocationDetailDrawer';

export default function LocationsPage() {
  const queryClient = useQueryClient();

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.locations.all({ page, pageSize, search, type: typeFilter }),
    queryFn: () => locationsApi.getLocations({ page, pageSize, search, type: typeFilter }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => locationsApi.deleteLocation(id),
    onSuccess: () => {
      toast.success('Ubicación eliminada');
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar ubicación. Verificá que no tenga inventario asignado.');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedLocation(null);
    setFormOpen(true);
  };

  const handleEdit = (loc: StorageLocation) => {
    setSelectedLocation(loc);
    setFormOpen(true);
  };

  const handleView = (loc: StorageLocation) => {
    setSelectedLocation(loc);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (loc: StorageLocation) => {
    setSelectedLocation(loc);
    setDeleteOpen(true);
  };

  const locations = data?.data ?? [];
  const total = data?.total ?? 0;

  const typeLabels = {
    'AREA': 'Área',
    'RACK': 'Rack',
    'SHELF': 'Estante',
    'BIN': 'Bin'
  };

  return (
    <PageContainer 
      title="Ubicaciones Internas" 
      subtitle="Definí la topología de tus depósitos (Pasillos, Racks, Estantes)."
      action={
        <ActionGuard action="manage" subject="Inventory">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Ubicación
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} ubicaciones</Badge>}>
        <SearchInput placeholder="Buscar por código, nombre o código de barras..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px'
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="AREA">Área</option>
          <option value="RACK">Rack</option>
          <option value="SHELF">Estante</option>
          <option value="BIN">Bin / Contenedor</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : locations.length === 0 ? (
          <EmptyState 
            icon={<Map size={40} />}
            title="No hay ubicaciones registradas" 
            message="Organizá físicamente el stock de tus depósitos mapeando tus racks y estantes." 
          />
        ) : (
          <Table
            keyField="id"
            data={locations}
            columns={[
              { 
                key: 'code', 
                header: 'Código',
                render: (l) => <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{l.code}</span>
              },
              { 
                key: 'name', 
                header: 'Nombre',
                render: (l) => <span style={{ color: 'var(--text-secondary)' }}>{l.name || '-'}</span>
              },
              { 
                key: 'type', 
                header: 'Tipo',
                render: (l) => <Badge color="purple">{typeLabels[l.type as keyof typeof typeLabels] || l.type}</Badge>
              },
              { 
                key: 'warehouse', 
                header: 'Depósito Padre',
                render: (l) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{l.warehouseName || l.warehouseId}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.branchName}</span>
                  </div>
                )
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (l) => <StatusChip label={l.isActive ? 'Activa' : 'Inactiva'} color={l.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (l) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(l)} aria-label="Ver" title="Ver detalle">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Inventory">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(l)} aria-label="Editar" title="Editar ubicación">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Inventory">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(l)} 
                        aria-label="Eliminar" 
                        title="Eliminar ubicación"
                      >
                        <Trash2 size={16} color="var(--red)" />
                      </Button>
                    </ActionGuard>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <LocationFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        locationToEdit={selectedLocation} 
      />
      
      <LocationDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        location={selectedLocation} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Ubicación"
        message={`¿Estás seguro de que querés eliminar la ubicación "${selectedLocation?.code}"? Esta acción fallará si hay stock actual asignado a esta posición.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedLocation && deleteMutation.mutate(selectedLocation.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
