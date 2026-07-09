import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { cashRegistersApi, type CreateCashRegisterDto } from '@/api/cashRegisters.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import type { CashRegister } from '@/types';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  registerToEdit?: CashRegister | null;
}

export function CashRegisterFormDrawer({ open, onClose, registerToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!registerToEdit;

  const [formData, setFormData] = useState<CreateCashRegisterDto>({
    name: '',
    branchId: '',
    isActive: true,
  });

  const { data: branchesData, isLoading: isLoadingBranches } = useQuery({
    queryKey: queryKeys.branches.all({ pageSize: 100 }),
    queryFn: () => branchesApi.getBranches({ pageSize: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (open && registerToEdit) {
      setFormData({
        name: registerToEdit.name,
        branchId: registerToEdit.branchId,
        isActive: registerToEdit.isActive,
      });
    } else if (open && !registerToEdit) {
      setFormData({
        name: '',
        branchId: '',
        isActive: true,
      });
    }
  }, [open, registerToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateCashRegisterDto) => {
      if (isEditing && registerToEdit) return cashRegistersApi.updateCashRegister(registerToEdit.id, data);
      return cashRegistersApi.createCashRegister(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Caja actualizada' : 'Caja creada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.cashRegisters.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la caja');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.branchId) {
      toast.error('El nombre y la sucursal son obligatorios');
      return;
    }
    mutation.mutate(formData);
  };

  const branches = branchesData?.data || [];

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Caja' : 'Nueva Caja'}
      onClose={onClose}
      width="sm"
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
        {registerToEdit && registerToEdit.status === 'OPEN' && (
          <div className={styles.alertYellow}>
            Atención: Esta caja se encuentra actualmente abierta y en uso. Los cambios de sucursal o nombre podrían afectar la sesión actual del cajero.
          </div>
        )}

        <Input
          label="Nombre de la Caja *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Sucursal Asociada *</label>
          <select
            value={formData.branchId}
            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            required
            disabled={isLoadingBranches}
            className={styles.select}
          >
            <option value="" disabled>Seleccionar sucursal...</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
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
            Caja Activa (Visible en el POS)
          </label>
        </div>
      </form>
    </Drawer>
  );
}
