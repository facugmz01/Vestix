import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { warehousesApi, type CreateWarehouseDto } from '@/api/warehouses.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import type { Warehouse } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  warehouseToEdit?: Warehouse | null;
}

export function WarehouseFormDrawer({ open, onClose, warehouseToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!warehouseToEdit;

  const [formData, setFormData] = useState<CreateWarehouseDto>({
    name: '',
    code: '',
    branchId: '',
    type: 'STORAGE',
    address: '',
    isActive: true,
  });

  // Fetch branches for the dropdown
  const { data: branchesData, isLoading: isLoadingBranches } = useQuery({
    queryKey: queryKeys.branches.all({ pageSize: 100 }),
    queryFn: () => branchesApi.getBranches({ pageSize: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (open && warehouseToEdit) {
      setFormData({
        name: warehouseToEdit.name,
        code: warehouseToEdit.code,
        branchId: warehouseToEdit.branchId,
        type: warehouseToEdit.type,
        address: warehouseToEdit.address || '',
        isActive: warehouseToEdit.isActive,
      });
    } else if (open && !warehouseToEdit) {
      setFormData({
        name: '',
        code: '',
        branchId: '',
        type: 'STORAGE',
        address: '',
        isActive: true,
      });
    }
  }, [open, warehouseToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateWarehouseDto) => {
      if (isEditing && warehouseToEdit) return warehousesApi.updateWarehouse(warehouseToEdit.id, data);
      return warehousesApi.createWarehouse(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Depósito actualizado' : 'Depósito creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.warehouses.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el depósito');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.branchId) {
      toast.error('Nombre, código y sucursal son obligatorios');
      return;
    }
    mutation.mutate(formData);
  };

  const branches = branchesData?.data || [];

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Depósito' : 'Nuevo Depósito'}
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Nombre del Depósito"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Código (ej. WH-01)"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Sucursal Asociada *</label>
            <select
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
              disabled={isLoadingBranches}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Seleccionar sucursal...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tipo de Depósito</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <option value="RETAIL">Venta al Público (Retail)</option>
              <option value="STORAGE">Almacenamiento Interno</option>
              <option value="TRANSIT">Depósito en Tránsito</option>
            </select>
          </div>
        </div>

        <Input
          label="Dirección Física (opcional)"
          value={formData.address || ''}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          helperText="Útil si el depósito principal de una sucursal está en otra ubicación física."
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <label htmlFor="isActive" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            Depósito Activo (Acepta movimientos)
          </label>
        </div>
      </form>
    </Drawer>
  );
}
