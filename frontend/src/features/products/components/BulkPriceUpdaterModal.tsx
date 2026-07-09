import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';


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
      <div className={styles.modalBody}>
        <p className={styles.modalIntro}>
          Esta herramienta modificará el <strong>Precio de Costo</strong> de los productos filtrados, lo cual impactará automáticamente en todas las listas de precios en cascada.
        </p>

        <div>
          <label className={styles.formLabelBlock}>
            Categoría (Opcional)
          </label>
          <select 
            value={categoryId} 
            onChange={e => setCategoryId(e.target.value)}
            className={styles.select}
          >
            <option value="">Todas las categorías</option>
            {categories?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.formLabelBlock}>
            Marca (Opcional)
          </label>
          <select 
            value={brandId} 
            onChange={e => setBrandId(e.target.value)}
            className={styles.select}
          >
            <option value="">Todas las marcas</option>
            {brands?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.formLabelBlock}>
            Porcentaje de Ajuste (%)
          </label>
          <Input 
            type="number" 
            placeholder="Ej: 15 (para aumentar 15%) o -5 (para descontar 5%)"
            value={percentage}
            onChange={e => setPercentage(e.target.value)}
            className={styles.selectFull}
          />
        </div>

        <div className={styles.actionFooter}>
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
