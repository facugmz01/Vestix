import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus } from 'lucide-react';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeProductId?: string;
}

export function RelatedProductsPicker({ selectedIds, onChange, excludeProductId }: Props) {
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: queryKeys.products.all({ search, pageSize: 20 }),
    queryFn: () => productsApi.getProducts({ search, pageSize: 20 }),
    enabled: search.length >= 2,
  });

  const results = (data?.data ?? []).filter(p => p.id !== excludeProductId && !selectedIds.includes(p.id));
  const selectedProducts = (data?.data ?? []).filter(p => selectedIds.includes(p.id));

  const addProduct = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
    setSearch('');
  };

  const removeProduct = (id: string) => onChange(selectedIds.filter(x => x !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar productos relacionados..."
          style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
        />
      </div>

      {search.length >= 2 && results.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '160px', overflowY: 'auto' }}>
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p.id)}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: '13px' }}>{p.name}</span>
              <Plus size={14} />
            </button>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {selectedIds.map(id => {
            const p = selectedProducts.find(x => x.id === id);
            return (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--bg-elevated)', borderRadius: '99px', fontSize: '12px', border: '1px solid var(--border)' }}>
                {p?.name || id.slice(0, 8)}
                <button type="button" onClick={() => removeProduct(id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
