import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { priceListsApi, type CreatePriceListDto } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import type { PriceList } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  listToEdit?: PriceList | null;
}

export function PriceListFormDrawer({ open, onClose, listToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!listToEdit;

  const [formData, setFormData] = useState<CreatePriceListDto>({
    name: '',
    code: '',
    currency: 'ARS',
    type: 'BASE',
    modifierPercentage: 0,
    isActive: true,
  });

  useEffect(() => {
    if (open && listToEdit) {
      setFormData({
        name: listToEdit.name,
        code: listToEdit.code,
        currency: listToEdit.currency,
        type: listToEdit.type,
        modifierPercentage: listToEdit.modifierPercentage || 0,
        isActive: listToEdit.isActive,
      });
    } else if (open && !listToEdit) {
      setFormData({
        name: '',
        code: '',
        currency: 'ARS',
        type: 'BASE',
        modifierPercentage: 0,
        isActive: true,
      });
    }
  }, [open, listToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreatePriceListDto) => {
      if (isEditing && listToEdit) return priceListsApi.updatePriceList(listToEdit.id, data);
      return priceListsApi.createPriceList(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Lista actualizada' : 'Lista creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.priceLists.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar lista');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Nombre y Código son obligatorios');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <Input label="Nombre de la Lista *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Input label="Código (Ej: MAYORISTA_A) *" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />

        <div className="grid-responsive grid-cols-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Moneda</label>
            <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Tipo de Lista</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BASE'|'MODIFIER' })} disabled={isEditing} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="BASE">Base (Precios fijos)</option>
              <option value="MODIFIER">Modificadora (%)</option>
            </select>
          </div>
        </div>

        {formData.type === 'MODIFIER' && (
          <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
            <Input 
              label="Porcentaje de Modificación (%)" 
              type="number" 
              step="0.1" 
              value={formData.modifierPercentage} 
              onChange={(e) => setFormData({ ...formData, modifierPercentage: Number(e.target.value) })} 
             
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
          <label htmlFor="isActive" style={{ fontSize: '14px' }}>Lista Activa</label>
        </div>

      </form>
    </Drawer>
  );
}
