import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input, StatusChip } from '@/components/ui';
import { usersApi, type CreateUserDto } from '@/api/users.api';
import { queryKeys } from '@/api/queryKeys';
import type { SystemUser } from '@/types';
import toast from 'react-hot-toast';

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
        role: 'CASHIER',
        branchId: '',
        isActive: true,
        password: '',
      });
    }
  }, [open, userToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateUserDto) => {
      if (isEditing && userToEdit) {
        return usersApi.updateUser(userToEdit.id, data);
      }
      return usersApi.createUser(data);
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

    const payload = { ...formData };
    if (!payload.branchId) {
      delete payload.branchId;
    }

    mutation.mutate(payload);
  };

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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            helperText="La contraseña debe tener al menos 8 caracteres."
          />
        )}

        {isEditing && (
          <Input
            label="Cambiar Contraseña (opcional)"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText="Dejá en blanco si no querés cambiarla."
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Rol</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="STORE_MANAGER">Gerente de Tienda</option>
            <option value="CASHIER">Cajero</option>
            <option value="WAREHOUSE_OPERATOR">Operario de Depósito</option>
            <option value="ECOMMERCE_MANAGER">Gerente E-commerce</option>
          </select>
        </div>

        <Input
          label="Sucursal ID (opcional)"
          value={formData.branchId || ''}
          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <label htmlFor="isActive" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            Usuario Activo
          </label>
        </div>
      </form>
    </Drawer>
  );
}
