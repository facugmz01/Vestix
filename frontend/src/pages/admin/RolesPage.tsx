import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip
} from '@/components/ui';

import { rolesApi } from '@/api/roles.api';
import { queryKeys } from '@/api/queryKeys';
import type { CustomRole } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { RoleFormDrawer } from '@/features/roles/components/RoleFormDrawer';
import { RoleDetailDrawer } from '@/features/roles/components/RoleDetailDrawer';

export default function RolesPage() {
  const queryClient = useQueryClient();

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.roles.all({ page, pageSize, search }),
    queryFn: () => rolesApi.getRoles({ page, pageSize, search }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      toast.success('Rol eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar rol');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedRole(null);
    setFormOpen(true);
  };

  const handleEdit = (role: CustomRole) => {
    setSelectedRole(role);
    setFormOpen(true);
  };

  const handleView = (role: CustomRole) => {
    setSelectedRole(role);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (role: CustomRole) => {
    if (role.isSystem) {
      toast.error('No podés eliminar un rol del sistema');
      return;
    }
    setSelectedRole(role);
    setDeleteOpen(true);
  };

  const roles = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Gestión de Roles y Permisos" 
      subtitle="Definí matrices de permisos para grupos de usuarios."
      action={
        <ActionGuard action="manage" subject="Settings">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nuevo Rol
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} roles</Badge>}>
        <SearchInput placeholder="Buscar rol..." onSearch={(val) => { setSearch(val); setPage(1); }} />
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : roles.length === 0 ? (
          <EmptyState 
            icon={<Shield size={40} />}
            title="No se encontraron roles" 
            message="Creá tu primer rol personalizado para asignar permisos granulares." 
          />
        ) : (
          <Table
            keyField="id"
            data={roles}
            columns={[
              { 
                key: 'name', 
                header: 'Nombre del Rol',
                render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span>
              },
              { 
                key: 'userCount', 
                header: 'Usuarios',
                render: (r) => <Badge color="gray">{r.userCount ?? 0}</Badge>
              },
              { 
                key: 'isSystem', 
                header: 'Tipo',
                render: (r) => r.isSystem 
                  ? <StatusChip label="Sistema" color="blue" size="sm" /> 
                  : <StatusChip label="Personalizado" color="gray" size="sm" />
              },
              {
                key: 'permissions',
                header: 'Nº Permisos',
                render: (r) => <Badge color="gray">{r.permissions.length}</Badge>
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(r)} aria-label="Ver" title="Ver detalle">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Settings">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} aria-label="Editar" title="Editar rol">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Settings">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(r)} 
                        disabled={r.isSystem}
                        aria-label="Eliminar" 
                        title={r.isSystem ? "Rol de sistema" : "Eliminar rol"}
                      >
                        <Trash2 size={16} color={r.isSystem ? "var(--text-muted)" : "var(--red)"} />
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
      <RoleFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        roleToEdit={selectedRole} 
      />
      
      <RoleDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        role={selectedRole} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Rol"
        message={`¿Estás seguro de que querés eliminar el rol "${selectedRole?.name}"? Los usuarios con este rol perderán acceso.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedRole && deleteMutation.mutate(selectedRole.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
