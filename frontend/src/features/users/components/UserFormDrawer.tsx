import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { usersApi, type CreateUserDto } from '@/api/users.api';
import { rolesApi } from '@/api/roles.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import type { SystemUser } from '@/types';
import { ROLE_LABELS } from '@/rbac/permissions';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  userToEdit?: SystemUser | null;
}

export function UserFormDrawer({ open, onClose, userToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!userToEdit;

  const [formData, setFormData] = useState<CreateUserDto>({
    email: '',
    fullName: '',
    role: 'CASHIER',
    branchId: '',
    isActive: true,
    password: '',
  });

  const { data: rolesData } = useQuery({
    queryKey: queryKeys.roles.all({ pageSize: 100 }),
    queryFn: () => rolesApi.getRoles({ pageSize: 100 }),
    enabled: open,
  });

  const { data: branchesData } = useQuery({
    queryKey: queryKeys.branches.all(),
    queryFn: () => branchesApi.getBranches({ pageSize: 100, isActive: true }),
    enabled: open,
  });

  const roles = rolesData?.data ?? [];
  const branches = branchesData?.data ?? [];

  useEffect(() => {
    if (open && userToEdit) {
      setFormData({
        email: userToEdit.email,
        fullName: userToEdit.fullName,
        role: userToEdit.role,
        branchId: userToEdit.branchId || '',
        isActive: userToEdit.isActive,
        password: '',
      });
    } else if (open && !userToEdit) {
      setFormData({
        email: '',
        fullName: '',
        role: roles[0]?.name || 'CASHIER',
        branchId: '',
        isActive: true,
        password: '',
      });
    }
  }, [open, userToEdit, roles]);

  const mutation = useMutation({
    mutationFn: (data: CreateUserDto) => {
      const payload = { ...data };
      if (isEditing && !payload.password) {
        delete payload.password;
      }
      if (isEditing && userToEdit) {
        return usersApi.updateUser(userToEdit.id, payload);
      }
      return usersApi.createUser(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Usuario actualizado' : 'Usuario creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar usuario');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || (!isEditing && !formData.password)) {
      toast.error('Completá los campos obligatorios');
      return;
    }
    if (!isEditing && formData.password && formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const payload = { ...formData };
    if (!payload.branchId) {
      delete payload.branchId;
    }

    mutation.mutate(payload);
  };

  const roleLabel = (name: string) =>
    ROLE_LABELS[name as keyof typeof ROLE_LABELS] || name;

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formStackMd}>
        <Input
          label="Nombre Completo"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        {!isEditing && (
          <div>
            <Input
              label="Contraseña"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <p className={styles.hintSm}>
              La contraseña debe tener al menos 8 caracteres.
            </p>
          </div>
        )}

        {isEditing && (
          <div>
            <Input
              label="Cambiar Contraseña (opcional)"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <p className={styles.hintSm}>
              Dejá en blanco si no querés cambiarla.
            </p>
          </div>
        )}

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Rol</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className={styles.select}
          >
            {roles.length === 0 ? (
              <option value={formData.role}>{roleLabel(formData.role)}</option>
            ) : (
              roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {roleLabel(r.name)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Sucursal (opcional)</label>
          <select
            value={formData.branchId || ''}
            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            className={styles.select}
          >
            <option value="">Sin sucursal asignada</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.checkboxRow}>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <label htmlFor="isActive" className={styles.checkboxLabel}>
            Usuario Activo
          </label>
        </div>
      </form>
    </Drawer>
  );
}
