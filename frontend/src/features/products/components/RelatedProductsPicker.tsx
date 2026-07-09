import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus } from 'lucide-react';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import styles from './ProductFormWidgets.module.css';

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
    <div className={styles.pickerStack}>
      <div className={styles.pickerSearchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar productos relacionados..."
          className={styles.pickerSearchInput}
        />
      </div>

      {search.length >= 2 && results.length > 0 && (
        <div className={styles.resultList}>
          {results.map(p => (
            <button key={p.id} type="button" onClick={() => addProduct(p.id)} className={styles.resultItem}>
              <span className={styles.resultName}>{p.name}</span>
              <Plus size={14} />
            </button>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className={styles.chipList}>
          {selectedIds.map(id => {
            const p = selectedProducts.find(x => x.id === id);
            return (
              <span key={id} className={styles.chip}>
                {p?.name || id.slice(0, 8)}
                <button type="button" onClick={() => removeProduct(id)} className={styles.chipRemove}>
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
