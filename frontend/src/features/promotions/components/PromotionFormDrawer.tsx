import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { promotionsApi, type CreatePromotionDto } from '@/api/promotions.api';
import { queryKeys } from '@/api/queryKeys';
import type { Promotion } from '@/types';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';


interface Props {
  open: boolean;
  onClose: () => void;
  promoToEdit?: Promotion | null;
}

export function PromotionFormDrawer({ open, onClose, promoToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!promoToEdit;

  const [formData, setFormData] = useState<CreatePromotionDto>({
    name: '',
    description: '',
    type: 'PERCENTAGE_DISCOUNT',
    value: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    applicableTo: { type: 'ALL', ids: [] },
  });

  useEffect(() => {
    if (open && promoToEdit) {
      setFormData({
        name: promoToEdit.name,
        description: promoToEdit.description || '',
        type: promoToEdit.type,
        value: promoToEdit.value,
        startDate: promoToEdit.startDate.split('T')[0],
        endDate: promoToEdit.endDate ? promoToEdit.endDate.split('T')[0] : '',
        isActive: promoToEdit.isActive,
        applicableTo: promoToEdit.applicableTo,
      });
    } else if (open && !promoToEdit) {
      setFormData({
        name: '',
        description: '',
        type: 'PERCENTAGE_DISCOUNT',
        value: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
        applicableTo: { type: 'ALL', ids: [] },
      });
    }
  }, [open, promoToEdit]);

  const mutation = useMutation({
    mutationFn: (data: CreatePromotionDto) => {
      // Ensure empty strings are treated as undefined for optional dates
      const payload = { ...data, endDate: data.endDate || undefined };
      if (isEditing && promoToEdit) return promotionsApi.updatePromotion(promoToEdit.id, payload);
      return promotionsApi.createPromotion(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Promoción actualizada' : 'Promoción creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar promoción');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('El nombre de la promoción es obligatorio');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formStackMd}>
        
        <Input label="Nombre de la Promo *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        
        <div className={styles.fieldGroupSm}>
          <label className={styles.selectLabel}>Descripción (Interna)</label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={styles.textarea}
            rows={3}
          />
        </div>

        <div className="grid-responsive grid-cols-2">
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Tipo de Regla</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className={styles.select}>
              <option value="PERCENTAGE_DISCOUNT">Descuento Porcentual (%)</option>
              <option value="FIXED_DISCOUNT">Descuento Fijo ($)</option>
              <option value="BOGO">2x1 / Llevá X Pagá Y (BOGO)</option>
              <option value="BULK_DISCOUNT">Descuento por Cantidad Mayorista</option>
            </select>
          </div>
          <Input 
            label="Valor del Beneficio" 
            type="number" 
            step="0.1" 
            value={formData.value} 
            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} 
           
          />
        </div>

        <div className="grid-responsive grid-cols-2">
          <Input label="Fecha Inicio *" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
          <Input label="Fecha Fin (Opcional)" type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
        </div>

        <div className={styles.sectionPanel}>
          <h4 className={styles.sectionPanelTitle}>Alcance (Applicable To)</h4>
          <select 
            value={formData.applicableTo.type} 
            onChange={(e) => setFormData({ ...formData, applicableTo: { type: e.target.value as any, ids: [] } })}
            className={clsx(styles.select, styles.selectFullMb)}
          >
            <option value="ALL">Todo el Catálogo</option>
            <option value="CATEGORY">Categoría Específica</option>
            <option value="BRAND">Marca Específica</option>
            <option value="PRODUCT">Productos Específicos</option>
          </select>
          {formData.applicableTo.type !== 'ALL' && (
            <p className={styles.scopeHint}>
              * ID Selector modal can be implemented here based on selection. For now, it applies to the selected filter via backend logic.
            </p>
          )}
        </div>

        <div className={styles.checkboxRow}>
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
          <label htmlFor="isActive" className={styles.checkboxLabel}>Activar Promoción</label>
        </div>

      </form>
    </Drawer>
  );
}
