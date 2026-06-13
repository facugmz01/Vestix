import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip
} from '@/components/ui';

import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import type { Branch } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { BranchFormDrawer } from '@/features/branches/components/BranchFormDrawer';
import { BranchDetailDrawer } from '@/features/branches/components/BranchDetailDrawer';

export default function BranchesPage() {
  const queryClient = useQueryClient();

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.branches.all({ page, pageSize, search }),
    queryFn: () => branchesApi.getBranches({ page, pageSize, search }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onSuccess: () => {
      toast.success('Sucursal eliminada');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar sucursal');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedBranch(null);
    setFormOpen(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormOpen(true);
  };

  const handleView = (branch: Branch) => {
    setSelectedBranch(branch);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (branch: Branch) => {
    if (branch.isMain) {
      toast.error('No podés eliminar la casa central. Reasigná otra sucursal como central primero.');
      return;
    }
    setSelectedBranch(branch);
    setDeleteOpen(true);
  };

  const branches = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Sucursales" 
      subtitle="Administrá las sucursales físicas y depósitos de la empresa."
      action={
        <ActionGuard action="manage" subject="Settings">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Sucursal
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} sucursales</Badge>}>
        <SearchInput placeholder="Buscar por nombre o código..." onSearch={(val) => { setSearch(val); setPage(1); }} />
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : branches.length === 0 ? (
          <EmptyState 
            icon={<MapPin size={40} />}
            title="No hay sucursales" 
            message="Registrá tus sucursales para empezar a gestionar stock por locación y facturación POS." 
          />
        ) : (
          <Table
            keyField="id"
            data={branches}
            columns={[
              { 
                key: 'name', 
                header: 'Nombre',
                render: (b) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                    {b.isMain && <Badge color="blue">Central</Badge>}
                  </div>
                )
              },
              { key: 'code', header: 'Código' },
              { 
                key: 'address', 
                header: 'Dirección',
                render: (b) => <span style={{ color: 'var(--text-secondary)' }}>{b.address || '-'}</span>
              },
              { 
                key: 'users', 
                header: 'Personal',
                render: (b) => b.userCount !== undefined ? <Badge color="gray">{b.userCount}</Badge> : '-'
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (b) => <StatusChip label={b.isActive ? 'Activa' : 'Inactiva'} color={b.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (b) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(b)} aria-label="Ver" title="Ver detalle">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Settings">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(b)} aria-label="Editar" title="Editar sucursal">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Settings">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(b)} 
                        disabled={b.isMain}
                        aria-label="Eliminar" 
                        title={b.isMain ? "Casa Central" : "Eliminar sucursal"}
                      >
                        <Trash2 size={16} color={b.isMain ? "var(--text-muted)" : "var(--red)"} />
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

      {/* Drawers and Modals */}
      <BranchFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        branchToEdit={selectedBranch} 
      />
      
      <BranchDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        branch={selectedBranch} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Sucursal"
        message={`¿Estás seguro de que querés eliminar la sucursal "${selectedBranch?.name}"? Esta acción no se puede deshacer y fallará si hay dependencias activas.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedBranch && deleteMutation.mutate(selectedBranch.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
