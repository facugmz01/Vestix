import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Trash2 } from 'lucide-react';
import { productsApi } from '@/api/products.api';
import { Button, Input } from '@/components/ui';

interface Props {
  costPrice: number;
  basePrice: number;
  onGenerate: (variants: any[]) => void;
}

export function VariantMassGenerator({ costPrice, basePrice, onGenerate }: Props) {
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

    // Cartesian product
    let combinations: any[] = [{}];
    attrNames.forEach(name => {
      const next: any[] = [];
      const values = selectedAttributes[name];
      
      // Map attribute name to internal key (Talle -> size, Color -> color)
      let key = name.toLowerCase();
      if (key === 'talle' || key === 'tamaño') key = 'size';
      if (key === 'color') key = 'color';

      values.forEach(val => {
        combinations.forEach(combo => {
          next.push({ ...combo, [key]: val });
        });
      });
      combinations = next;
    });

    const variants = combinations.map(combo => ({
      ...combo,
      costPrice,
      basePrice,
      isActive: true,
      sku: '' 
    }));

    onGenerate(variants);
    setSelectedAttributes({}); // Limpiar selección después de generar
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h4 style={{ fontWeight: 600 }}>Generador Masivo</h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {attributes?.map(attr => (
          <div key={attr.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{attr.name}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {attr.values.map(v => {
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
