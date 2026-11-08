import { useEffect, useMemo, useState } from 'react';
import { Tags, Star, Grid2X2, List, Columns3, SlidersHorizontal, X } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { resolveProductImage } from '@/utils/imageUrl';
import { SafeImage } from '@/components/ui';
import { PosFavoritesBar } from './PosFavoritesBar';
import styles from '@/pages/pos/POSPage.module.css';
import type { ProductVariant } from '@/types';
import type { PriceList } from '@/types';
import type { PosCatalogFilters } from '../hooks/usePosOffline';

type PosVariant = ProductVariant & {
  name?: string;
  productName?: string;
  category?: string;
  brand?: string;
  stock?: number;
  imageUrl?: string | null;
  categoryId?: string;
  brandId?: string;
  product?: { name?: string; images?: string[] };
};

export function POSProductGrid({
  products,
  searchResults,
  search,
  filters,
  priceLists,
  onFiltersChange,
}: {
  products: PosVariant[] | undefined;
  searchResults: PosVariant[] | undefined;
  search: string;
  filters: PosCatalogFilters;
  priceLists: PriceList[];
  onFiltersChange: (filters: PosCatalogFilters) => void;
}) {
  const addVariantWithRecent = usePosStore(s => s.addVariantWithRecent);
  const toggleFavorite = usePosStore(s => s.toggleFavorite);
  const favoriteVariantIds = usePosStore(s => s.favoriteVariantIds);
  const recentVariantIds = usePosStore(s => s.recentVariantIds);
  // La vista principal del POS prioriza velocidad de lectura y densidad.
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'double'>(() => {
    if (typeof window === 'undefined') return 'list';
    const stored = window.localStorage.getItem('vestix-pos-view-mode');
    return stored === 'cards' || stored === 'double' || stored === 'list' ? stored : 'list';
  });
  const [visibleCount, setVisibleCount] = useState(60);

  const displayedProducts = search.length >= 2 ? searchResults : products;

  const categoryOptions = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    products?.forEach(p => {
      if (!p.categoryId || !p.category) return;
      const current = map.get(p.categoryId);
      map.set(p.categoryId, { name: p.category, count: (current?.count ?? 0) + 1 });
    });
    return Array.from(map.entries()).map(([id, value]) => ({ id, ...value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return displayedProducts ?? [];
  }, [displayedProducts]);

  useEffect(() => {
    setVisibleCount(60);
  }, [search, filters.categoryId, filters.brandId, filters.priceListId, filters.stock, viewMode]);

  useEffect(() => {
    window.localStorage.setItem('vestix-pos-view-mode', viewMode);
  }, [viewMode]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filteredProducts.length;

  const brandOptions = useMemo(() => Array.from(new Map(
    (products ?? []).filter(p => p.brandId && p.brand).map(p => [p.brandId!, p.brand!]),
  ).entries()).sort((a, b) => a[1].localeCompare(b[1])), [products]);
  const activeFilterCount = [filters.categoryId, filters.brandId, filters.priceListId,
    filters.stock && filters.stock !== 'ALL' ? filters.stock : undefined].filter(Boolean).length;
  const updateFilter = (key: keyof PosCatalogFilters, value: string) =>
    onFiltersChange({ ...filters, [key]: value || undefined });
  const hasFilters = activeFilterCount > 0;

  const getName = (p: PosVariant) =>
    p.name || p.productName || p.product?.name || 'Producto';

  const getImage = (p: PosVariant) => resolveProductImage(p);

  return (
    <section className={styles.productsArea} aria-label="Catálogo de productos">
      <PosFavoritesBar
        products={products}
        favoriteIds={favoriteVariantIds}
        recentIds={recentVariantIds}
        onSelect={addVariantWithRecent}
      />

      <div className={styles.posFilters} aria-label="Filtros de catálogo">
        <div className={styles.filterTitle}><SlidersHorizontal size={15} /> Filtrar catálogo</div>
        <select aria-label="Filtrar por categoría" value={filters.categoryId ?? ''} onChange={e => updateFilter('categoryId', e.target.value)}>
          <option value="">Todas las categorías ({products?.length ?? 0})</option>
          {categoryOptions.map(cat => <option key={cat.id} value={cat.id}>{cat.name} ({cat.count})</option>)}
        </select>
        <select aria-label="Filtrar por marca" value={filters.brandId ?? ''} onChange={e => updateFilter('brandId', e.target.value)}>
          <option value="">Todas las marcas</option>
          {brandOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select aria-label="Filtrar por lista de precios" value={filters.priceListId ?? ''} onChange={e => updateFilter('priceListId', e.target.value)}>
          <option value="">Precio general</option>
          {priceLists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}
        </select>
        <select aria-label="Filtrar por stock" value={filters.stock ?? 'ALL'} onChange={e => updateFilter('stock', e.target.value as PosCatalogFilters['stock'] || 'ALL')}>
          <option value="ALL">Cualquier stock</option>
          <option value="IN_STOCK">Con stock</option>
          <option value="OUT_OF_STOCK">Sin stock</option>
        </select>
        {hasFilters && <button type="button" className={styles.clearPosFilters} onClick={() => onFiltersChange({})}><X size={13} /> Limpiar ({activeFilterCount})</button>}
        <div className={styles.viewToggle} role="group" aria-label="Vista de productos">
          <button type="button" className={viewMode === 'cards' ? styles.viewToggleActive : ''} onClick={() => setViewMode('cards')} aria-label="Vista de tarjetas" aria-pressed={viewMode === 'cards'}><Grid2X2 size={15} /></button>
          <button type="button" className={viewMode === 'list' ? styles.viewToggleActive : ''} onClick={() => setViewMode('list')} aria-label="Vista de listado" aria-pressed={viewMode === 'list'}><List size={15} /></button>
          <button type="button" className={viewMode === 'double' ? styles.viewToggleActive : ''} onClick={() => setViewMode('double')} aria-label="Vista doble" aria-pressed={viewMode === 'double'}><Columns3 size={15} /></button>
        </div>
      </div>

      <div className={styles.productsHeader}>
        <h2 className={styles.chooseProductsTitle}>Elegir productos</h2>
        <span className={styles.productsCount}>{filteredProducts.length}</span>
      </div>

      <div className={viewMode === 'list' ? styles.productsList : viewMode === 'double' ? styles.productsDouble : styles.productsGrid}>
        {visibleProducts.map(p => {
          const isFavorite = favoriteVariantIds.includes(p.id);
          const name = getName(p);
          if (viewMode === 'list') {
            return (
              <article key={p.id} className={styles.productListRow}>
                <div className={styles.productListIdentity}>
                  <div className={styles.productListThumb}><SafeImage src={getImage(p)} alt="" className={styles.productImgFile} fallback={<Tags size={20} />} /></div>
                  <div><div className={styles.productListName}>{name}</div><div className={styles.productListSku}>{p.sku || 'Sin SKU'}{p.size ? ` · ${p.size}` : ''}{p.color ? ` · ${p.color}` : ''}</div></div>
                </div>
                <span className={styles.productListStock} data-stock={typeof p.stock === 'number' ? (p.stock <= 0 ? 'empty' : p.stock <= 5 ? 'low' : 'ok') : 'unknown'}>{typeof p.stock === 'number' ? `Stock: ${p.stock}` : 'Stock —'}</span>
                <span className={styles.productListPrice}>{formatCurrency(p.basePrice)}</span>
                <button type="button" className={styles.productListFavorite} onClick={() => toggleFavorite(p.id)} aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}><Star size={15} fill={isFavorite ? 'currentColor' : 'none'} /></button>
                <button type="button" className={styles.productListAdd} onClick={() => addVariantWithRecent(p)}>Agregar</button>
              </article>
            );
          }
          if (viewMode === 'double') {
            return (
              <article key={p.id} className={styles.productDoubleRow}>
                <div className={styles.productListIdentity}>
                  <div className={styles.productDoubleThumb}><SafeImage src={getImage(p)} alt="" className={styles.productImgFile} fallback={<Tags size={16} />} /></div>
                  <div><div className={styles.productListName} title={name}>{name}</div><div className={styles.productListSku}>{p.sku || 'Sin SKU'}{p.size ? ` · ${p.size}` : ''}{p.color ? ` · ${p.color}` : ''}</div></div>
                </div>
                <span className={styles.productListStock} data-stock={typeof p.stock === 'number' ? (p.stock <= 0 ? 'empty' : p.stock <= 5 ? 'low' : 'ok') : 'unknown'}>{typeof p.stock === 'number' ? p.stock : '—'}</span>
                <span className={styles.productListPrice}>{formatCurrency(p.basePrice)}</span>
                <button type="button" className={styles.productListAdd} onClick={() => addVariantWithRecent(p)}>Agregar</button>
              </article>
            );
          }
          return (
            <article key={p.id} className={styles.productCard}>
              <button
                type="button"
                className={styles.favoriteBtn}
                onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                className={styles.productCardBtn}
                onClick={() => addVariantWithRecent(p)}
                aria-label={`Agregar ${name}`}
              >
                <div className={styles.productImg}>
                  <SafeImage
                    src={getImage(p)}
                    alt=""
                    className={styles.productImgFile}
                    fallback={<Tags size={32} />}
                  />
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productName} title={name}>{name}</div>
                  <div className={styles.productMeta}>
                    {p.sku ? <span className={styles.productSku}>{p.sku}</span> : null}
                    {p.size ? <span className={styles.productBadge}>{p.size}</span> : null}
                    {p.color ? <span className={styles.productBadge}>{p.color}</span> : null}
                  </div>
                  <div className={styles.productFooter}>
                    {typeof p.stock === 'number' ? (
                      <span className={styles.productStock} data-low={p.stock <= 5}>
                        Disp. {p.stock}
                      </span>
                    ) : (
                      <span className={styles.productStock}>—</span>
                    )}
                    <span className={styles.productPrice}>{formatCurrency(p.basePrice)}</span>
                  </div>
                </div>
              </button>
            </article>
          );
        })}

        {hasMoreProducts && (
          <button type="button" className={styles.loadMoreProducts} onClick={() => setVisibleCount(count => count + 60)}>
            Mostrar más productos ({filteredProducts.length - visibleCount} restantes)
          </button>
        )}

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <Tags size={48} />
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </section>
  );
}
