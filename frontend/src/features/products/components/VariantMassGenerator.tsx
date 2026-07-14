import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/ui';
import clsx from 'clsx';
import styles from './ProductFormWidgets.module.css';

interface Props {
  costPrice: number;
  basePrice: number;
  baseSku?: string;
  onGenerate: (variants: any[]) => void;
}

function buildVariantSku(baseSku: string, attributes: Record<string, string>): string {
  const base = (baseSku || 'PROD').trim() || 'PROD';
  const sortedKeys = Object.keys(attributes).sort();
  const parts = sortedKeys.map(key =>
    String(attributes[key]).replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase(),
  ).filter(Boolean);
  return parts.length ? `${base}-${parts.join('-')}` : base;
}

export function VariantMassGenerator({ costPrice, basePrice, baseSku, onGenerate }: Props) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  
  const { data: attributes } = useQuery({
    queryKey: queryKeys.attributes.all(),
    queryFn: () => productsApi.getAttributes(),
  });

  const toggleValue = (attrName: string, value: string) => {
    setSelectedAttributes(prev => {
      const values = prev[attrName] || [];
      if (values.includes(value)) {
        return { ...prev, [attrName]: values.filter(v => v !== value) };
      }
      return { ...prev, [attrName]: [...values, value] };
    });
  };

  const generate = () => {
    const attrNames = Object.keys(selectedAttributes).filter(k => selectedAttributes[k].length > 0);
    if (attrNames.length === 0) return;

    let combinations: any[] = [{}];
    
    attrNames.forEach(name => {
      const next: any[] = [];
      const values = selectedAttributes[name];

      values.forEach(val => {
        combinations.forEach(combo => {
          next.push({ ...combo, [name]: val });
        });
      });
      combinations = next;
    });

    const usedSkus = new Set<string>();
    const variants = combinations.map(combo => {
      const colorKey = Object.keys(combo).find(k => 
        ['color', 'colores', 'cor'].includes(k.toLowerCase())
      );
      const sizeKey = Object.keys(combo).find(k => 
        ['size', 'sizes', 'talle', 'talles', 'talla', 'tallas', 'tamaño', 'tamaños'].includes(k.toLowerCase()) || 
        k.toLowerCase().startsWith('talle')
      );

      let sku = buildVariantSku(baseSku || '', combo);
      while (usedSkus.has(sku)) {
        sku = `${sku}-X`;
      }
      usedSkus.add(sku);

      return {
        color: colorKey ? combo[colorKey] : undefined,
        size: sizeKey ? combo[sizeKey] : undefined,
        attributes: combo,
        costPrice,
        basePrice,
        isActive: true,
        sku,
        barcode: '',
      };
    });

    onGenerate(variants);
    setSelectedAttributes({});
  };

  return (
    <div className={styles.generator}>
      <h4 className={styles.generatorTitle}>Generador Masivo</h4>
      
      <div className={styles.attrGrid}>
        {attributes?.map(attr => (
          <div key={attr.id} className={styles.attrGroup}>
            <label className={styles.attrLabel}>{attr.name}</label>
            <div className={styles.attrValues}>
              {attr.values.map((v: any) => {
                const isSelected = selectedAttributes[attr.name]?.includes(v.value);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleValue(attr.name, v.value)}
                    className={clsx(styles.attrChip, isSelected && styles.attrChipSelected)}
                  >
                    {v.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" icon={<RefreshCw size={14} />} onClick={generate}>
        Generar Combinaciones
      </Button>
    </div>
  );
}
