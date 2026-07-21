import { useMemo, useState } from 'react';
import { Tags, Star } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { PosFavoritesBar } from './PosFavoritesBar';
import styles from '@/pages/pos/POSPage.module.css';
import type { ProductVariant } from '@/types';

type PosVariant = ProductVariant & {
  name?: string;
  productName?: string;
  category?: string;
  brand?: string;
  stock?: number;
  imageUrl?: string | null;
  product?: { name?: string; images?: string[] };
};

export function POSProductGrid({
  products,
  searchResults,
  search,
}: {
  products: PosVariant[] | undefined;
  searchResults: PosVariant[] | undefined;
  search: string;
}) {
  const addVariantWithRecent = usePosStore(s => s.addVariantWithRecent);
  const toggleFavorite = usePosStore(s => s.toggleFavorite);
  const favoriteVariantIds = usePosStore(s => s.favoriteVariantIds);
  const recentVariantIds = usePosStore(s => s.recentVariantIds);

  const [categoryFilter, setCategoryFilter] = useState('');

  const displayedProducts = search.length >= 2 ? searchResults : products;

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    products?.forEach(p => {
      if (!p.category) return;
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!displayedProducts) return [];
    if (!categoryFilter) return displayedProducts;
    return displayedProducts.filter(p => p.category === categoryFilter);
  }, [displayedProducts, categoryFilter]);

  const getName = (p: PosVariant) =>
    p.name || p.productName || p.product?.name || 'Producto';

  const getImage = (p: PosVariant) =>
    p.imageUrl || p.product?.images?.[0] || null;

  return (
    <section className={styles.productsArea} aria-label="Catálogo de productos">
      <PosFavoritesBar
        products={products}
        favoriteIds={favoriteVariantIds}
        recentIds={recentVariantIds}
        onSelect={addVariantWithRecent}
      />

      <div className={styles.categoryRibbon} role="tablist" aria-label="Categorías">
        <button
          type="button"
          role="tab"
          aria-selected={!categoryFilter}
          className={`${styles.categoryChip} ${!categoryFilter ? styles.categoryChipActive : ''}`}
          onClick={() => setCategoryFilter('')}
        >
          <span className={styles.categoryChipName}>Todos</span>
          <span className={styles.categoryChipCount}>{products?.length ?? 0}</span>
        </button>
        {categoryCounts.map(cat => (
          <button
            key={cat.name}
            type="button"
            role="tab"
            aria-selected={categoryFilter === cat.name}
            className={`${styles.categoryChip} ${categoryFilter === cat.name ? styles.categoryChipActive : ''}`}
            onClick={() => setCategoryFilter(cat.name)}
          >
            <span className={styles.categoryChipName}>{cat.name}</span>
            <span className={styles.categoryChipCount}>{cat.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.productsHeader}>
        <h2 className={styles.chooseProductsTitle}>Elegir productos</h2>
        <span className={styles.productsCount}>{filteredProducts.length}</span>
      </div>

      <div className={styles.productsGrid}>
        {filteredProducts.map(p => {
          const isFavorite = favoriteVariantIds.includes(p.id);
          const name = getName(p);
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
                  {getImage(p) ? (
                    <img src={getImage(p)!} alt="" className={styles.productImgFile} />
                  ) : (
                    <Tags size={32} />
                  )}
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
