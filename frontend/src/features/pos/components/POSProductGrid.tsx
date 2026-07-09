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
  const [brandFilter, setBrandFilter] = useState('');

  const displayedProducts = search.length >= 2 ? searchResults : products;

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products?.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats).sort();
  }, [products]);

  const brands = useMemo(() => {
    const b = new Set<string>();
    products?.forEach(p => { if (p.brand) b.add(p.brand); });
    return Array.from(b).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!displayedProducts) return [];
    return displayedProducts.filter(p => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (brandFilter && p.brand !== brandFilter) return false;
      return true;
    });
  }, [displayedProducts, categoryFilter, brandFilter]);

  const getName = (p: PosVariant) => p.name || p.productName || 'Producto';

  const handleProductClick = (p: PosVariant) => {
    addVariantWithRecent(p);
  };

  return (
    <div className={styles.productsArea}>
      <PosFavoritesBar
        products={products}
        favoriteIds={favoriteVariantIds}
        recentIds={recentVariantIds}
        onSelect={addVariantWithRecent}
      />

      <div className={styles.productsHeader}>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          aria-label="Filtrar por categoría"
          className={styles.filterSelect}
        >
          <option value="">Todas las Categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          aria-label="Filtrar por marca"
          className={styles.filterSelect}
        >
          <option value="">Todas las Marcas</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className={styles.productsGrid}>
        {filteredProducts.map(p => {
          const isFavorite = favoriteVariantIds.includes(p.id);
          return (
            <div key={p.id} className={styles.productCard}>
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
                onClick={() => handleProductClick(p)}
              >
                <div className={styles.productImg}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={getName(p)} className={styles.productImgFile} />
                  ) : (
                    <Tags size={36} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productName}>{getName(p)} {p.size ? `(${p.size})` : ''}</div>
                  <div className={styles.productPrice}>{formatCurrency(p.basePrice)}</div>
                  {typeof p.stock === 'number' && (
                    <div className={styles.productStock} data-low={p.stock <= 5}>
                      Stock: {p.stock}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className={styles.emptyState}>
            <Tags size={48} />
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
