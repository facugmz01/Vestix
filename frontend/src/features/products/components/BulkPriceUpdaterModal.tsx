import { useState, useMemo } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { 
  Percent, 
  Layers, 
  Tag, 
  ListFilter, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  DollarSign 
} from 'lucide-react';
import styles from './BulkPriceUpdaterModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  initialPriceListId?: string;
}

const QUICK_PERCENTAGES = [5, 10, 15, 20, 25, 30, -5, -10, -15];

export function BulkPriceUpdaterModal({ open, onClose, initialPriceListId = '' }: Props) {
  const [priceListId, setPriceListId] = useState(initialPriceListId);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [percentage, setPercentage] = useState('');
  const [rounding, setRounding] = useState<'round' | 'none' | 'ceil' | 'floor'>('round');
  const queryClient = useQueryClient();

  // Queries
  const { data: categories } = useQuery({ 
    queryKey: queryKeys.categories.all(), 
    queryFn: () => productsApi.getCategories(),
    enabled: open,
  });
  
  const { data: brands } = useQuery({ 
    queryKey: queryKeys.brands.all(), 
    queryFn: () => productsApi.getBrands(),
    enabled: open,
  });

  const { data: priceListsData } = useQuery({
    queryKey: queryKeys.priceLists.all({ pageSize: 100 }),
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100 }),
    enabled: open,
  });

  const priceLists = priceListsData?.data || [];

  // Count products matching current filters
  const { data: previewData, isLoading: loadingPreview } = useQuery({
    queryKey: ['products', 'bulk-preview', categoryId, brandId],
    queryFn: () => productsApi.getProducts({
      categoryId: categoryId || undefined,
      brandId: brandId || undefined,
      pageSize: 1,
    }),
    enabled: open,
  });

  const totalAffectedProducts = previewData?.total ?? 0;

  const selectedPriceList = useMemo(() => {
    return priceLists.find(pl => pl.id === priceListId);
  }, [priceLists, priceListId]);

  const isModifierSelected = selectedPriceList?.type === 'MODIFIER';

  const mutation = useMutation({
    mutationFn: async () => {
      const perc = parseFloat(percentage);
      if (isNaN(perc)) throw new Error('Debes ingresar un porcentaje válido.');
      if (perc === 0) throw new Error('El porcentaje no puede ser 0%.');
      
      const payload: {
        percentage: number;
        categoryId?: string;
        brandId?: string;
        priceListId?: string;
        rounding?: 'none' | 'round' | 'ceil' | 'floor';
      } = {
        percentage: perc,
        rounding,
      };

      if (categoryId) payload.categoryId = categoryId;
      if (brandId) payload.brandId = brandId;
      if (priceListId) payload.priceListId = priceListId;

      return productsApi.bulkUpdatePrices(payload);
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(
          `Precios actualizados: ${res.updatedCount} productos (${res.updatedVariantsCount ?? 0} variantes) en ${res.target || 'Precio Base'}`
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: ['priceLists'] });
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al actualizar precios masivamente');
    }
  });

  const handleApply = () => {
    if (!percentage) {
      toast.error('Debes ingresar un porcentaje de ajuste.');
      return;
    }
    const perc = parseFloat(percentage);
    if (isNaN(perc)) {
      toast.error('Porcentaje inválido.');
      return;
    }
    if (isModifierSelected) {
      toast.error('No se pueden modificar precios fijos en una lista modificadora.');
      return;
    }

    if (!categoryId && !brandId) {
      const targetName = selectedPriceList ? `la lista "${selectedPriceList.name}"` : 'el Precio Base de TODOS los productos';
      const confirmed = window.confirm(
        `⚠️ ATENCIÓN: No seleccionaste ninguna categoría ni marca.\n\nEsto modificará los precios de ${targetName} (${totalAffectedProducts} productos).\n\n¿Deseas continuar?`
      );
      if (!confirmed) return;
    }
    mutation.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Actualización Masiva de Precios" size="lg">
      <div className={styles.modalBody}>
        {/* Intro */}
        <div className={styles.introBanner}>
          <Info size={20} className={styles.introIcon} />
          <div>
            Ajustá los precios de venta de forma masiva aplicando un porcentaje positivo (aumento) o negativo (descuento).
            El <strong>Precio de Costo</strong> permanece intacto ya que proviene de Órdenes de Compra.
          </div>
        </div>

        {/* Price List Selector */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <DollarSign size={15} />
            <span>Lista de Precios a Modificar</span>
            <span className={styles.required}>*</span>
          </label>
          <select
            value={priceListId}
            onChange={(e) => setPriceListId(e.target.value)}
            className={styles.select}
          >
            <option value="">Precio Base del Catálogo (General / Ventas por defecto)</option>
            {priceLists.map((pl) => (
              <option key={pl.id} value={pl.id}>
                {pl.name} {pl.type === 'MODIFIER' ? `(Modificadora Dinámica %${pl.modifierPercentage})` : '(Lista Fija)'}
              </option>
            ))}
          </select>
        </div>

        {isModifierSelected && (
          <div className={styles.warningBox}>
            <AlertTriangle size={18} />
            <div>
              <strong>Lista Modificadora Dinámica:</strong> Esta lista calcula automáticamente su valor aplicando un %
              sobre el Precio Base. Para ajustar precios sobre esta lista, seleccioná <strong>Precio Base del Catálogo</strong> o
              editá el porcentaje global en la sección Listas de Precios.
            </div>
          </div>
        )}

        {/* Filters Grid: Category & Brand */}
        <div className={styles.gridTwo}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Layers size={15} />
              <span>Categoría (Filtro)</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={styles.select}
            >
              <option value="">Todas las categorías</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Tag size={15} />
              <span>Marca (Filtro)</span>
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={styles.select}
            >
              <option value="">Todas las marcas</option>
              {brands?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Percentage Input & Quick Buttons */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <Percent size={15} />
            <span>Porcentaje de Ajuste (%)</span>
            <span className={styles.required}>*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            placeholder="Ej: 15 (aumentar 15%) o -10 (bajar 10%)"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
          />
          <div className={styles.quickButtonsRow}>
            {QUICK_PERCENTAGES.map((pct) => (
              <button
                key={pct}
                type="button"
                className={`${styles.quickBtn} ${percentage === String(pct) ? styles.quickBtnActive : ''}`}
                onClick={() => setPercentage(String(pct))}
              >
                {pct > 0 ? `+${pct}%` : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Rounding Mode */}
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            <ListFilter size={15} />
            <span>Criterio de Redondeo</span>
          </label>
          <select
            value={rounding}
            onChange={(e) => setRounding(e.target.value as any)}
            className={styles.select}
          >
            <option value="round">Redondear al entero más cercano (Recomendado en ARS, ej: $1.250)</option>
            <option value="ceil">Redondear hacia arriba (Al entero superior)</option>
            <option value="floor">Redondear hacia abajo (Al entero inferior)</option>
            <option value="none">Sin redondeo (Conserva 2 decimales, ej: $1.250,50)</option>
          </select>
        </div>

        {/* Impact Preview Card */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <span>Resumen del Impacto</span>
            <span className={styles.previewHighlight}>
              {loadingPreview ? 'Calculando...' : `${totalAffectedProducts} productos encontrados`}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span>Destino:</span>
            <span className={styles.previewValue}>
              {selectedPriceList ? `Lista "${selectedPriceList.name}"` : 'Precio Base del Catálogo (General)'}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span>Categoría:</span>
            <span className={styles.previewValue}>
              {categoryId ? categories?.find((c) => c.id === categoryId)?.name ?? 'Seleccionada' : 'Todas'}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span>Marca:</span>
            <span className={styles.previewValue}>
              {brandId ? brands?.find((b) => b.id === brandId)?.name ?? 'Seleccionada' : 'Todas'}
            </span>
          </div>
          <div className={styles.previewRow}>
            <span>Ajuste:</span>
            <span className={styles.previewValue}>
              {percentage ? `${parseFloat(percentage) > 0 ? '+' : ''}${percentage}%` : 'Sin definir'}
            </span>
          </div>
        </div>

        {!categoryId && !brandId && (
          <div className={styles.warningBox}>
            <AlertTriangle size={18} />
            <div>
              <strong>Alcance total:</strong> No has filtrado por categoría ni marca. Este cambio afectará a los{' '}
              <strong>{totalAffectedProducts}</strong> productos del catálogo.
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={mutation.isPending || !percentage || isModifierSelected}
            icon={mutation.isPending ? undefined : <CheckCircle2 size={16} />}
          >
            {mutation.isPending ? 'Actualizando precios...' : 'Aplicar Actualización'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
