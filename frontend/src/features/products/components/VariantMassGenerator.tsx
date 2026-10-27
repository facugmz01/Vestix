import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { productsApi } from '@/api/products.api';
import { identifiersApi } from '@/api/identifiers.api';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/ui';
import clsx from 'clsx';
import styles from './ProductFormWidgets.module.css';

interface Props {
  costPrice: number;
  basePrice: number;
  baseSku?: string;
  onBaseSkuChange?: (sku: string) => void;
  onGenerate: (variants: any[]) => void;
}

function formatTraitCode(val: unknown, isSize: boolean = false): string {
  if (val == null) return '';
  const str = String(val).trim();
  if (!str) return '';

  const normalized = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (isSize) {
    const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return cleaned.substring(0, 4);
  }

  const words = normalized.split(/[\s\-_/]+/).filter(w => w.trim().length > 0);
  if (words.length >= 2) {
    const w1 = words[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const w2 = words[1].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (w1.length >= 2 && w2.length >= 1) {
      return `${w1.substring(0, 2)}${w2.substring(0, 1)}`;
    }
  }

  const cleaned = normalized.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleaned.substring(0, 3);
}

function isSizeKey(key: string): boolean {
  const k = (key || '').toLowerCase().trim();
  return (
    ['size', 'sizes', 'talle', 'talles', 'talla', 'tallas', 'tamano', 'tamanos'].includes(k) ||
    k.startsWith('talle')
  );
}

function isColorKey(key: string): boolean {
  const k = (key || '').toLowerCase().trim();
  return ['color', 'colores', 'cor'].includes(k);
}

function buildVariantSku(baseSku: string, attributes: Record<string, string>): string {
  const base = (baseSku || 'PROD').trim() || 'PROD';
  const validKeys = Object.keys(attributes || {}).filter(k => {
    const v = attributes[k];
    return v != null && String(v).trim() !== '';
  });

  if (validKeys.length === 0) return base;

  const sortedKeys = [...validKeys].sort((a, b) => {
    const aIsColor = isColorKey(a);
    const bIsColor = isColorKey(b);
    if (aIsColor && !bIsColor) return -1;
    if (!aIsColor && bIsColor) return 1;

    const aIsSize = isSizeKey(a);
    const bIsSize = isSizeKey(b);
    if (aIsSize && !bIsSize) return -1;
    if (!aIsSize && bIsSize) return 1;

    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const traits = sortedKeys
    .map(key => formatTraitCode(attributes[key], isSizeKey(key)))
    .filter(Boolean);

  return traits.length > 0 ? `${base}-${traits.join('-')}` : base;
}

export function VariantMassGenerator({ costPrice, basePrice, baseSku, onBaseSkuChange, onGenerate }: Props) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [generating, setGenerating] = useState(false);
  
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

  const generate = async () => {
    const attrNames = Object.keys(selectedAttributes).filter(k => selectedAttributes[k].length > 0);
    if (attrNames.length === 0) return;

    setGenerating(true);
    let effectiveBaseSku = (baseSku || '').trim();

    // If no base SKU defined yet, auto-generate sequential base SKU from settings (e.g. SKU0001, PROD-0001)
    if (!effectiveBaseSku) {
      try {
        const res = await identifiersApi.generateBaseSku();
        if (res?.sku) {
          effectiveBaseSku = res.sku;
          onBaseSkuChange?.(res.sku);
        }
      } catch (err) {
        console.error('Error auto-generating base SKU:', err);
      }
    }

    if (!effectiveBaseSku) {
      effectiveBaseSku = 'PROD';
    }

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

      let sku = buildVariantSku(effectiveBaseSku, combo);
      while (usedSkus.has(sku.toUpperCase())) {
        const rand = Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, '0');
        sku = `${sku}-${rand}`;
      }
      usedSkus.add(sku.toUpperCase());

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
    setGenerating(false);
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

      <Button type="button" variant="secondary" icon={<RefreshCw size={14} />} onClick={generate} loading={generating} disabled={generating}>
        Generar Combinaciones
      </Button>
    </div>
  );
}
