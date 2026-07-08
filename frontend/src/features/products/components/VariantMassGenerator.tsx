import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { productsApi } from '@/api/products.api';
import { Button } from '@/components/ui';

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
    queryKey: ['attributes'],
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h4 style={{ fontWeight: 600 }}>Generador Masivo</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {attributes?.map(attr => (
          <div key={attr.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{attr.name}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {attr.values.map((v: any) => {
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
                      cursor: 'pointer'
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

      <Button type="button" variant="secondary" icon={<RefreshCw size={14} />} onClick={generate}>
        Generar Combinaciones
      </Button>
    </div>
  );
}
