import { useMemo, useState } from 'react';
import { Tags, Star, Package } from 'lucide-react';
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

  const getName = (p: PosVariant) =>
    p.name || p.productName || p.product?.name || 'Producto';

  const getImage = (p: PosVariant) =>
    p.imageUrl || p.product?.images?.[0] || null;

  const handleProductClick = (p: PosVariant) => {
    addVariantWithRecent(p);
  };

  return (
    <section className={styles.productsArea} aria-label="Catálogo de productos">
      <PosFavoritesBar
        products={products}
        favoriteIds={favoriteVariantIds}
        recentIds={recentVariantIds}
        onSelect={addVariantWithRecent}
      />

      <div className={styles.productsHeader}>
        <div className={styles.productsHeaderTitle}>
          <Package size={16} />
          <span>Productos</span>
          <span className={styles.productsCount}>{filteredProducts.length}</span>
        </div>
        <div className={styles.productsFilters}>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            aria-label="Filtrar por categoría"
            className={styles.filterSelect}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
            aria-label="Filtrar por marca"
            className={styles.filterSelect}
          >
            <option value="">Todas las marcas</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
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
                onClick={() => handleProductClick(p)}
                aria-label={`Agregar ${name}`}
              >
                <div className={styles.productImg}>
                  {getImage(p) ? (
                    <img src={getImage(p)!} alt="" className={styles.productImgFile} />
                  ) : (
                    <Tags size={28} />
                  )}
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productName} title={name}>{name}</div>
                  <div className={styles.productMeta}>
                    {p.size ? <span className={styles.productBadge}>{p.size}</span> : null}
                    {p.color ? <span className={styles.productBadge}>{p.color}</span> : null}
                    {p.sku ? <span className={styles.productSku}>{p.sku}</span> : null}
                  </div>
                  <div className={styles.productFooter}>
                    <span className={styles.productPrice}>{formatCurrency(p.basePrice)}</span>
                    {typeof p.stock === 'number' && (
                      <span className={styles.productStock} data-low={p.stock <= 5}>
                        Stock {p.stock}
                      </span>
                    )}
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
