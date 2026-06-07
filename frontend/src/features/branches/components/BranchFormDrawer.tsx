import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { branchesApi, type CreateBranchDto } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import type { Branch } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  branchToEdit?: Branch | null;
}

export function BranchFormDrawer({ open, onClose, branchToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!branchToEdit;

  const [formData, setFormData] = useState<CreateBranchDto>({
    name: '',
    code: '',
    address: '',
    phone: '',
    isActive: true,
    isMain: false,
    settings: {
      taxId: '',
      posReceiptHeader: '',
      posReceiptFooter: '',
    },
  });

  useEffect(() => {
    if (open && branchToEdit) {
      setFormData({
        name: branchToEdit.name,
        code: branchToEdit.code,
        address: branchToEdit.address || '',
        phone: branchToEdit.phone || '',
        isActive: branchToEdit.isActive,
        isMain: branchToEdit.isMain,
        settings: {
          taxId: branchToEdit.settings?.taxId || '',
          posReceiptHeader: branchToEdit.settings?.posReceiptHeader || '',
          posReceiptFooter: branchToEdit.settings?.posReceiptFooter || '',
        },
      });
    } else if (open && !branchToEdit) {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        isActive: true,
        isMain: false,
        settings: {
          taxId: '',
          posReceiptHeader: '',
          posReceiptFooter: '',
        },
      });
    }
  }, [open, branchToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreateBranchDto) => {
      if (isEditing && branchToEdit) return branchesApi.updateBranch(branchToEdit.id, data);
      return branchesApi.createBranch(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Sucursal actualizada' : 'Sucursal creada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar la sucursal');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('El nombre y el código son obligatorios');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Basic Info */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Información Principal
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Nombre de Sucursal"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Código Interno (ej. SUC01)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
            <Input
              label="Dirección"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <Input
              label="Teléfono"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                Sucursal Activa
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="isMain"
                checked={formData.isMain}
                onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
              />
              <label htmlFor="isMain" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                Es Casa Central
              </label>
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Settings */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Configuración & POS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="CUIT / Tax ID Local"
              value={formData.settings.taxId || ''}
              onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, taxId: e.target.value } })}
             
            />
            <Input
              label="Cabecera Ticket POS"
              value={formData.settings.posReceiptHeader || ''}
              onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, posReceiptHeader: e.target.value } })}
            />
            <Input
              label="Pie de Ticket POS"
              value={formData.settings.posReceiptFooter || ''}
              onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, posReceiptFooter: e.target.value } })}
             
            />
          </div>
        </div>

      </form>
    </Drawer>
  );
}
