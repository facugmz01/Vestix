import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { variantsApi, type CreateVariantDto } from '@/api/variants.api';
import { identifiersApi } from '@/api/identifiers.api';
import { queryKeys } from '@/api/queryKeys';
import type { ProductVariant } from '@/types';
import toast from 'react-hot-toast';
import { Wand2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  variantToEdit?: ProductVariant | null;
}

export function VariantFormDrawer({ open, onClose, productId, variantToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!variantToEdit;

  const [formData, setFormData] = useState<CreateVariantDto>({
    productId,
    sku: '',
    barcode: '',
    size: '',
    color: '',
    basePrice: 0,
    costPrice: 0,
    isActive: true,
  });

  useEffect(() => {
    if (open && variantToEdit) {
      setFormData({
        productId: variantToEdit.productId,
        sku: variantToEdit.sku,
        barcode: variantToEdit.barcode || '',
        size: variantToEdit.size || '',
        color: variantToEdit.color || '',
        basePrice: variantToEdit.basePrice,
        costPrice: variantToEdit.costPrice || 0,
        isActive: variantToEdit.isActive,
      });
    } else if (open && !variantToEdit) {
      setFormData({
        productId,
        sku: '',
        barcode: '',
        size: '',
        color: '',
        basePrice: 0,
        costPrice: 0,
        isActive: true,
      });
    }
  }, [open, variantToEdit, productId]);

  const mutation = useMutation({
    mutationFn: (data: CreateVariantDto) => {
      if (isEditing && variantToEdit) return variantsApi.updateVariant(variantToEdit.id, data);
      return variantsApi.createVariant(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Variante actualizada' : 'Variante creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(productId) });
      onClose();
    },
    onError: (error: any) => {
      if (error?.response?.status === 409) {
        toast.error('Error: El SKU o Código de Barras ingresado ya existe en otra variante.');
      } else {
        toast.error(error.message || 'Error al guardar variante');
      }
    },
  });

  const generateSkuMutation = useMutation({
    mutationFn: () => identifiersApi.generateSku(productId, [formData.color, formData.size].filter(Boolean) as string[]),
    onSuccess: (res) => setFormData(prev => ({ ...prev, sku: res.sku })),
    onError: () => toast.error('Error al generar SKU automáticamente'),
  });

  const generateBarcodeMutation = useMutation({
    mutationFn: () => identifiersApi.generateBarcode(),
    onSuccess: (res) => setFormData(prev => ({ ...prev, barcode: res.barcode })),
    onError: () => toast.error('Error al generar código de barras'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku.trim()) {
      toast.error('El SKU es obligatorio');
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Variante' : 'Nueva Variante Unitaria'}
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>SKU *</label>
              <button type="button" onClick={() => generateSkuMutation.mutate()} disabled={generateSkuMutation.isPending} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wand2 size={12} /> Auto-generar
              </button>
            </div>
            <input 
              value={formData.sku} 
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })} 
              required 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Cód. Barras (EAN-13)</label>
              <button type="button" onClick={() => generateBarcodeMutation.mutate()} disabled={generateBarcodeMutation.isPending} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wand2 size={12} /> Auto-generar
              </button>
            </div>
            <input 
              value={formData.barcode || ''} 
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="Color" value={formData.color || ''} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
          <Input label="Talle / Tamaño" value={formData.size || ''} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
        </div>

        <Input 
          label="Precio Base ($) *" 
          type="number" 
          step="0.01" 
          min="0" 
          value={formData.basePrice} 
          onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })} 
          required 
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
          <label htmlFor="isActive" style={{ fontSize: '14px' }}>Variante Activa</label>
        </div>

      </form>
    </Drawer>
  );
}
