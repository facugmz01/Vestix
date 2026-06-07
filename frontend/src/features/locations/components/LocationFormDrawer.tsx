import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { locationsApi, type CreateLocationDto } from '@/api/locations.api';
import { branchesApi } from '@/api/branches.api';
import { warehousesApi } from '@/api/warehouses.api';
import { queryKeys } from '@/api/queryKeys';
import type { StorageLocation, StorageLocationType } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  locationToEdit?: StorageLocation | null;
}

export function LocationFormDrawer({ open, onClose, locationToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!locationToEdit;

  const [selectedBranchId, setSelectedBranchId] = useState('');
  
  const [formData, setFormData] = useState<CreateLocationDto>({
    code: '',
    name: '',
    warehouseId: '',
    type: 'SHELF',
    barcode: '',
    isActive: true,
  });

  // Fetch branches
  const { data: branchesData, isLoading: isLoadingBranches } = useQuery({
    queryKey: queryKeys.branches.all({ pageSize: 100 }),
    queryFn: () => branchesApi.getBranches({ pageSize: 100 }),
    enabled: open,
  });

  // Fetch warehouses based on selected branch
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: queryKeys.warehouses.all({ branchId: selectedBranchId, pageSize: 100 }),
    queryFn: () => warehousesApi.getWarehouses({ branchId: selectedBranchId, pageSize: 100 }),
    enabled: open && !!selectedBranchId,
  });

  useEffect(() => {
    if (open && locationToEdit) {
      setFormData({
        code: locationToEdit.code,
        name: locationToEdit.name || '',
        warehouseId: locationToEdit.warehouseId,
        type: locationToEdit.type,
        barcode: locationToEdit.barcode || '',
        isActive: locationToEdit.isActive,
      });
      // We ideally need the branchId of the warehouse to pre-fill the cascaded dropdown.
      // If we don't have it on the DTO, we might need to fetch the warehouse detail,
      // but assuming the backend can handle just the warehouseId if we set it directly.
      // For simplicity, we just set the warehouseId directly.
    } else if (open && !locationToEdit) {
      setFormData({
        code: '',
        name: '',
        warehouseId: '',
        type: 'SHELF',
        barcode: '',
        isActive: true,
      });
      setSelectedBranchId('');
    }
  }, [open, locationToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateLocationDto) => {
      if (isEditing && locationToEdit) return locationsApi.updateLocation(locationToEdit.id, data);
      return locationsApi.createLocation(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Ubicación actualizada' : 'Ubicación creada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la ubicación');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.warehouseId) {
      toast.error('Código y Depósito son obligatorios');
      return;
    }
    mutation.mutate(formData);
  };

  const branches = branchesData?.data || [];
  const warehouses = warehousesData?.data || [];

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
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
        
        {/* Only show cascaded selectors if creating new, or let edit it if needed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <h4 style={{ fontSize: '13px', margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jerarquía</h4>
          
          {!isEditing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>1. Seleccionar Sucursal</label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setFormData(prev => ({ ...prev, warehouseId: '' }));
                }}
                disabled={isLoadingBranches}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
              >
                <option value="">(Opcional) Filtrar por sucursal...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>2. Depósito *</label>
            <select
              value={formData.warehouseId}
              onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
              required
              disabled={isLoadingWarehouses && !!selectedBranchId}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Seleccionar depósito...</option>
              {isEditing && locationToEdit?.warehouseName && (
                 <option value={formData.warehouseId}>{locationToEdit.warehouseName}</option>
              )}
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Código de Ubicación *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
           
          />
          <Input
            label="Nombre Descriptivo (opcional)"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
           
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as StorageLocationType })}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <option value="AREA">Área (Zona general)</option>
              <option value="RACK">Rack (Pasillo/Módulo)</option>
              <option value="SHELF">Estante (Nivel)</option>
              <option value="BIN">Contenedor / Bin</option>
            </select>
          </div>

          <Input
            label="Código de Barras (opcional)"
            value={formData.barcode || ''}
            onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
           
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          <label htmlFor="isActive" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            Ubicación Activa
          </label>
        </div>
      </form>
    </Drawer>
  );
}
