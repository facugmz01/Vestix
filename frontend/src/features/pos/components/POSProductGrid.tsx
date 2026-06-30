import { Tags } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '../../pages/pos/POSPage.module.css';
import type { ProductVariant } from '@/types';

export function POSProductGrid({
  products,
  searchResults,
  search
}: {
  products: ProductVariant[] | undefined;
  searchResults: ProductVariant[] | undefined;
  search: string;
}) {
  const addToCart = usePosStore(s => s.addToCart);
  
  const displayedProducts = search.length >= 2 ? searchResults : products;

  return (
    <div className={styles.productsArea}>
      <div className={styles.productsHeader}>
        <select style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', outline: 'none' }}>
          <option>Todas las Categorías</option>
        </select>
        <select style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', outline: 'none' }}>
          <option>Todas las Marcas</option>
        </select>
      </div>
      
      <div className={styles.productsGrid}>
        {displayedProducts?.map(p => (
          <div key={p.id} className={styles.productCard} onClick={() => addToCart(p)}>
            <div className={styles.productImg}>
              <Tags size={36} />
            </div>
            <div className={styles.productInfo}>
              <div className={styles.productName}>{(p as any).name || (p as any).productName || 'Producto'} {p.size ? `(${p.size})` : ''}</div>
              <div className={styles.productPrice}>{formatCurrency(p.basePrice)}</div>
            </div>
          </div>
        ))}
        
        {(!displayedProducts || displayedProducts.length === 0) && (
          <div className={styles.emptyState}>
            <Tags size={48} />
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}
