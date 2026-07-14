import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package } from 'lucide-react';

import { productsApi } from '@/api/products.api';
import { purchasesApi } from '@/api/purchases.api';
import { queryKeys } from '@/api/queryKeys';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';

export type PurchaseCatalogHit = {
  id: string;
  sku: string;
  name: string;
  size?: string;
  color?: string;
  costPrice?: number;
  basePrice?: number;
};

type Props = {
  enabled?: boolean;
  autoFocus?: boolean;
  /** IDs de variantes ya en el carrito: se muestran primero y resaltadas */
  selectedVariantIds?: string[];
  onSelect: (product: PurchaseCatalogHit) => void;
  /** Contenido prioritario debajo de la búsqueda (p.ej. líneas seleccionadas) */
  priorityContent?: ReactNode;
};

export function PurchaseCatalogSearch({
  enabled = true,
  autoFocus = false,
  selectedVariantIds = [],
  onSelect,
  priorityContent,
}: Props) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
    enabled,
  });

  const { data: brands = [] } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => productsApi.getBrands(),
    enabled,
  });

  const hasTextQuery = search.trim().length >= 3;
  const hasFilters = Boolean(categoryId || brandId);
  const canSearch = hasTextQuery || hasFilters;

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['purchase-catalog-search', search, categoryId, brandId],
    queryFn: async (): Promise<PurchaseCatalogHit[]> => {
      const rows = await purchasesApi.searchCatalog(search.trim(), {
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      });
      return (rows || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name || p.productName || p.product?.name || p.sku,
        size: p.size,
        color: p.color,
        costPrice: p.costPrice,
        basePrice: p.basePrice,
      }));
    },
    enabled: enabled && canSearch,
  });

  const selectedSet = new Set(selectedVariantIds);
  const sortedResults = [...searchResults].sort((a, b) => {
    const aSel = selectedSet.has(a.id) ? 0 : 1;
    const bSel = selectedSet.has(b.id) ? 0 : 1;
    return aSel - bSel;
  });

  const handleSelect = (product: PurchaseCatalogHit) => {
    onSelect(product);
  };

  return (
    <div className={styles.purchaseMain}>
      <div className={styles.purchaseSearchWrap}>
        <Search size={18} className={styles.searchFieldIconLg} />
        <input
          type="text"
          placeholder="Buscar catálogo por SKU, nombre o código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchFieldInputLg}
          autoFocus={autoFocus}
        />
      </div>

      <div className={styles.purchaseFilterRow}>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className={styles.purchaseFilterSelect}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={brandId}
          onChange={e => setBrandId(e.target.value)}
          className={styles.purchaseFilterSelect}
          aria-label="Filtrar por marca"
        >
          <option value="">Todas las marcas</option>
          {brands.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {canSearch && (
        <div className={styles.catalogResultsStrip}>
          {isSearching ? (
            <p className={styles.purchaseStatusMsg}>Buscando en catálogo...</p>
          ) : sortedResults.length > 0 ? (
            <div className={styles.productGrid}>
              {sortedResults.map((p) => {
                const isSelected = selectedSet.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelect(p)}
                    className={`${styles.productCard} ${isSelected ? styles.productCardSelected : ''}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelect(p)}
                  >
                    {isSelected && <span className={styles.productCardBadge}>En lista</span>}
                    <p className={styles.productCardSku}>{p.sku}</p>
                    <p className={styles.productCardName}>
                      {p.name}
                      {p.size ? ` (${p.size})` : ''}
                      {p.color ? ` · ${p.color}` : ''}
                    </p>
                    <p className={styles.productCardPrice}>{formatCurrency(p.costPrice ?? p.basePrice ?? 0)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.purchaseStatusMsg}>No se encontraron resultados.</p>
          )}
        </div>
      )}

      {!canSearch && !priorityContent && (
        <div className={styles.purchaseEmpty}>
          <Package size={48} className={styles.purchaseEmptyIcon} />
          <p>Escribí al menos 3 letras o filtrá por categoría / marca.</p>
        </div>
      )}

      {priorityContent && (
        <div className={styles.purchasePrioritySlot}>
          {priorityContent}
        </div>
      )}
    </div>
  );
}
