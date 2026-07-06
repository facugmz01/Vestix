import { useMemo, useState } from 'react';
import { Tags } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/pages/pos/POSPage.module.css';
import type { ProductVariant } from '@/types';

type PosVariant = ProductVariant & {
  name?: string;
  productName?: string;
  category?: string;
  brand?: string;
  stock?: number;
};

export function POSProductGrid({
  products,
  searchResults,
  search
}: {
  products: PosVariant[] | undefined;
  searchResults: PosVariant[] | undefined;
  search: string;
}) {
  const addToCart = usePosStore(s => s.addToCart);
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

  return (
    <div className={styles.productsArea}>
      <div className={styles.productsHeader}>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', outline: 'none' }}
        >
          <option value="">Todas las Categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', outline: 'none' }}
        >
          <option value="">Todas las Marcas</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>
      
      <div className={styles.productsGrid}>
        {filteredProducts.map(p => (
          <div key={p.id} className={styles.productCard} onClick={() => addToCart(p)}>
            <div className={styles.productImg}>
              <Tags size={36} />
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
          </div>
        ))}
        
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
