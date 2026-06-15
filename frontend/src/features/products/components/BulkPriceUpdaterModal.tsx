import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function BulkPriceUpdaterModal({ open, onClose }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [percentage, setPercentage] = useState('');
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ 
    queryKey: queryKeys.categories.all(), 
    queryFn: () => productsApi.getCategories() 
  });
  
  const { data: brands } = useQuery({ 
    queryKey: queryKeys.brands.all(), 
    queryFn: () => productsApi.getBrands() 
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const perc = parseFloat(percentage);
      if (isNaN(perc)) throw new Error('Porcentaje inválido');
      
      const payload: any = { percentage: perc };
      if (categoryId) payload.categoryId = categoryId;
      if (brandId) payload.brandId = brandId;

      return productsApi.bulkUpdatePrices(payload);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(`Precios actualizados exitosamente (${res.updatedCount} productos)`);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar precios masivamente');
    }
  });

  const handleApply = () => {
    if (!percentage) {
      toast.error('Debes ingresar un porcentaje');
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Actualización Masiva de Precios">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Esta herramienta modificará el <strong>Precio de Costo</strong> de los productos filtrados, lo cual impactará automáticamente en todas las listas de precios en cascada.
        </p>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Categoría (Opcional)
          </label>
          <select 
            value={categoryId} 
            onChange={e => setCategoryId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            <option value="">Todas las categorías</option>
            {categories?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Marca (Opcional)
          </label>
          <select 
            value={brandId} 
            onChange={e => setBrandId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            <option value="">Todas las marcas</option>
            {brands?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
            Porcentaje de Ajuste (%)
          </label>
          <Input 
            type="number" 
            placeholder="Ej: 15 (para aumentar 15%) o -5 (para descontar 5%)"
            value={percentage}
            onChange={e => setPercentage(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="primary" 
            onClick={handleApply} 
            disabled={mutation.isPending || !percentage}
          >
            {mutation.isPending ? 'Procesando...' : 'Aplicar Actualización'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
