import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Box } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip, Tabs
} from '@/components/ui';

import { warehousesApi } from '@/api/warehouses.api';
import { queryKeys } from '@/api/queryKeys';
import type { Warehouse } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { WarehouseFormDrawer } from '@/features/warehouses/components/WarehouseFormDrawer';
import { WarehouseDetailDrawer } from '@/features/warehouses/components/WarehouseDetailDrawer';

export default function WarehousesPage() {
  const queryClient = useQueryClient();

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.warehouses.all({ page, pageSize, search }),
    queryFn: () => warehousesApi.getWarehouses({ page, pageSize, search }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehousesApi.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Depósito eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar depósito. Verificá que no tenga stock activo.');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedWarehouse(null);
    setFormOpen(true);
  };

  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormOpen(true);
  };

  const handleView = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteOpen(true);
  };

  const warehouses = data?.data ?? [];
  const total = data?.total ?? 0;

  const typeLabels = {
    'RETAIL': 'Venta Público',
    'STORAGE': 'Almacenamiento',
    'TRANSIT': 'Tránsito'
  };

  return (
    <PageContainer 
      title="Depósitos" 
      subtitle="Gestioná los lugares físicos y lógicos donde se almacena el inventario."
      action={
        <ActionGuard action="manage" subject="Inventory">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nuevo Depósito
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} depósitos</Badge>}>
        <SearchInput placeholder="Buscar por nombre o código..." onSearch={(val) => { setSearch(val); setPage(1); }} />
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : warehouses.length === 0 ? (
          <EmptyState 
            icon={<Box size={40} />}
            title="No hay depósitos registrados" 
            message="Creá al menos un depósito para poder recibir compras y realizar ventas." 
          />
        ) : (
          <Table
            keyField="id"
            data={warehouses}
            columns={[
              { 
                key: 'name', 
                header: 'Nombre',
                render: (w) => <span style={{ fontWeight: 600 }}>{w.name}</span>
              },
              { key: 'code', header: 'Código' },
              { 
                key: 'type', 
                header: 'Tipo',
                render: (w) => <Badge color="purple">{typeLabels[w.type as keyof typeof typeLabels] || w.type}</Badge>
              },
              { 
                key: 'branch', 
                header: 'Sucursal',
                render: (w) => <span style={{ color: 'var(--text-secondary)' }}>{w.branchName || w.branchId}</span>
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (w) => <StatusChip label={w.isActive ? 'Activo' : 'Inactivo'} color={w.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (w) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(w)} aria-label="Ver" title="Ver detalle">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Inventory">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(w)} aria-label="Editar" title="Editar depósito">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Inventory">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(w)} 
                        aria-label="Eliminar" 
                        title="Eliminar depósito"
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

      <WarehouseFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        warehouseToEdit={selectedWarehouse} 
      />
      
      <WarehouseDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        warehouse={selectedWarehouse} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Depósito"
        message={`¿Estás seguro de que querés eliminar el depósito "${selectedWarehouse?.name}"? Esta acción no se puede deshacer y fallará si hay stock o movimientos asociados a él.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedWarehouse && deleteMutation.mutate(selectedWarehouse.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
