import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip, Tabs
} from '@/components/ui';

import { usersApi } from '@/api/users.api';
import { queryKeys } from '@/api/queryKeys';
import type { SystemUser } from '@/types';
import { ROLE_LABELS } from '@/rbac/permissions';
import { ActionGuard } from '@/rbac/ActionGuard';
import { useAuthStore } from '@/store/auth.store';

import { UserFormDrawer } from '@/features/users/components/UserFormDrawer';
import { UserDetailDrawer } from '@/features/users/components/UserDetailDrawer';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(s => s.user);

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.users.all({ page, pageSize, search, role: roleFilter }),
    queryFn: () => usersApi.getUsers({ page, pageSize, search, role: roleFilter }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar usuario');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user: SystemUser) => {
    setSelectedUser(user);
    setFormOpen(true);
  };

  const handleView = (user: SystemUser) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      toast.error('No podés eliminar tu propio usuario');
      return;
    }
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Gestión de Usuarios" 
      subtitle="Administrá los accesos y roles del sistema."
      action={
        <ActionGuard action="manage" subject="Users">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nuevo Usuario
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} usuarios totales</Badge>}>
        <SearchInput placeholder="Buscar por nombre o email..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px'
          }}
        >
          <option value="">Todos los roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="STORE_MANAGER">Gerente de Tienda</option>
          <option value="CASHIER">Cajero</option>
          <option value="WAREHOUSE_OPERATOR">Operario</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : users.length === 0 ? (
          <EmptyState 
            title="No se encontraron usuarios" 
            message="No hay usuarios que coincidan con la búsqueda." 
          />
        ) : (
          <Table
            keyField="id"
            data={users}
            columns={[
              { 
                key: 'fullName', 
                header: 'Nombre',
                render: (u) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                      {u.fullName.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.fullName}</span>
                  </div>
                )
              },
              { key: 'email', header: 'Email' },
              { 
                key: 'role', 
                header: 'Rol',
                render: (u) => <Badge color="blue">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}</Badge>
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (u) => <StatusChip label={u.isActive ? 'Activo' : 'Inactivo'} color={u.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (u) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(u)} aria-label="Ver" title="Ver detalle">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Users">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} aria-label="Editar" title="Editar usuario">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Users">
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(u)} aria-label="Eliminar" title="Eliminar usuario">
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

      {/* Drawers and Modals */}
      <UserFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        userToEdit={selectedUser} 
      />
      
      <UserDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        user={selectedUser} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que querés eliminar al usuario "${selectedUser?.fullName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
