import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button, Input } from '@/components/ui';
import { productsApi } from '@/api/products.api';
import { variantsApi } from '@/api/variants.api';
import { queryKeys } from '@/api/queryKeys';
import {
  buildVariantDrafts,
  countCombinations,
  type VariantCombinationDraft,
} from '@/features/variants/utils/variant-combinations.util';

export type VariantGeneratorMode = 'preview' | 'persist';

interface Props {
  mode: VariantGeneratorMode;
  basePrice?: number;
  costPrice?: number;
  productId?: string;
  onPreview?: (variants: VariantCombinationDraft[]) => void;
  onPersistSuccess?: () => void;
}

export function VariantCombinationGenerator({
  mode,
  basePrice: initialBasePrice = 0,
  costPrice: initialCostPrice = 0,
  productId,
  onPreview,
  onPersistSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [basePrice, setBasePrice] = useState(initialBasePrice);
  const [costPrice] = useState(initialCostPrice);

  const { data: attributes } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => productsApi.getAttributes(),
  });

  const combinationCount = useMemo(() => countCombinations(selectedAttributes), [selectedAttributes]);

  const toggleValue = (attrName: string, value: string) => {
    setSelectedAttributes(prev => {
      const values = prev[attrName] || [];
      if (values.includes(value)) {
        return { ...prev, [attrName]: values.filter(v => v !== value) };
      }
      return { ...prev, [attrName]: [...values, value] };
    });
  };

  const persistMutation = useMutation({
    mutationFn: () => {
      if (!productId) throw new Error('Producto no definido');
      return variantsApi.generateCombinations(productId, {
        attributes: selectedAttributes,
        basePrice,
      });
    },
    onSuccess: generated => {
      toast.success(`Se generaron ${generated.length} variantes combinadas exitosamente`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(productId!) });
      setSelectedAttributes({});
      onPersistSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al generar combinaciones');
    },
  });

  const handleGenerate = () => {
    if (combinationCount === 0) {
      toast.error('Seleccioná al menos un valor de atributo para combinar');
      return;
    }

    if (mode === 'preview') {
      const drafts = buildVariantDrafts(selectedAttributes, costPrice, basePrice);
      onPreview?.(drafts);
      setSelectedAttributes({});
      toast.success(`Se generaron ${drafts.length} variantes en el borrador`);
      return;
    }

    persistMutation.mutate();
  };

  const isPending = persistMutation.isPending;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: mode === 'preview' ? '20px' : 0,
        background: mode === 'preview' ? 'var(--bg-elevated)' : 'transparent',
        borderRadius: 'var(--radius)',
        border: mode === 'preview' ? '1px solid var(--border)' : 'none',
      }}
    >
      {mode === 'preview' && <h4 style={{ fontWeight: 600, margin: 0 }}>Generador Masivo</h4>}

      <div
        style={{
          padding: mode === 'persist' ? '12px' : 0,
          background: mode === 'persist' ? 'var(--bg-elevated)' : 'transparent',
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}
      >
        Seleccioná valores de los atributos del catálogo. El sistema generará todas las combinaciones
        posibles{mode === 'persist' ? ' y las guardará como variantes' : ' en el borrador del producto'}.
      </div>

      {attributes && attributes.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {attributes.map(attr => (
            <div key={attr.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {attr.name}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {attr.values.map((v: { id: string; value: string }) => {
                  const isSelected = selectedAttributes[attr.name]?.includes(v.value);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleValue(attr.name, v.value)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border)',
                        background: isSelected ? 'var(--brand-dim)' : 'var(--bg-base)',
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      {v.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          No hay atributos configurados. Creá atributos en Catálogo → Atributos (ej. Color, Talle).
        </p>
      )}

      <Input
        label="Precio base para las variantes generadas ($)"
        type="number"
        value={basePrice}
        onChange={e => setBasePrice(Number(e.target.value))}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {combinationCount > 0
            ? `${combinationCount} combinación${combinationCount === 1 ? '' : 'es'}`
            : 'Sin combinaciones seleccionadas'}
        </span>
        <Button
          type="button"
          variant={mode === 'persist' ? 'primary' : 'secondary'}
          icon={mode === 'persist' ? <Shuffle size={14} /> : <RefreshCw size={14} />}
          loading={isPending}
          onClick={handleGenerate}
          disabled={combinationCount === 0}
        >
          {mode === 'persist'
            ? `Generar ${combinationCount || 0} variantes`
            : 'Generar combinaciones'}
        </Button>
      </div>
    </div>
  );
}
