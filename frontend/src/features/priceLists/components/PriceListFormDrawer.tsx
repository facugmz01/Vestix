import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { priceListsApi, type CreatePriceListDto } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import type { PriceList } from '@/types';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';


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
    isDefault: false,
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
        isDefault: listToEdit.isDefault ?? false,
      });
    } else if (open && !listToEdit) {
      setFormData({
        name: '',
        code: '',
        currency: 'ARS',
        type: 'BASE',
        modifierPercentage: 0,
        isActive: true,
        isDefault: false,
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
      <form onSubmit={handleSubmit} className={styles.formStackMd}>
        
        <Input label="Nombre de la Lista *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <Input label="Código (Ej: MAYORISTA_A) *" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />

        <div className="grid-responsive grid-cols-2">
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Moneda</label>
            <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className={styles.select}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Tipo de Lista</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BASE'|'MODIFIER' })} disabled={isEditing} className={styles.select}>
              <option value="BASE">Base (Precios fijos)</option>
              <option value="MODIFIER">Modificadora (%)</option>
            </select>
          </div>
        </div>

        {formData.type === 'MODIFIER' && (
          <div className={styles.sectionPanel}>
            <Input 
              label="Porcentaje de Modificación (%)" 
              type="number" 
              step="0.1" 
              value={formData.modifierPercentage} 
              onChange={(e) => setFormData({ ...formData, modifierPercentage: Number(e.target.value) })} 
             
            />
          </div>
        )}

        <div className={styles.checkboxRow}>
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
          <label htmlFor="isActive" className={styles.checkboxLabel}>Lista Activa</label>
        </div>

        <div className={styles.checkboxRow}>
          <input type="checkbox" id="isDefault" checked={!!formData.isDefault} onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })} />
          <label htmlFor="isDefault" className={styles.checkboxLabel}>Lista por defecto (POS y ventas sin cliente asignado)</label>
        </div>

      </form>
    </Drawer>
  );
}
