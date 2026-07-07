import { Star, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/pages/pos/POSPage.module.css';
import type { ProductVariant } from '@/types';

type PosVariant = ProductVariant & {
  name?: string;
  productName?: string;
  imageUrl?: string | null;
};

export function PosFavoritesBar({
  products,
  favoriteIds,
  recentIds,
  onSelect,
}: {
  products: PosVariant[] | undefined;
  favoriteIds: string[];
  recentIds: string[];
  onSelect: (variant: PosVariant) => void;
}) {
  const productMap = new Map(products?.map(p => [p.id, p]) ?? []);

  const favorites = favoriteIds.map(id => productMap.get(id)).filter(Boolean) as PosVariant[];
  const recents = recentIds
    .filter(id => !favoriteIds.includes(id))
    .map(id => productMap.get(id))
    .filter(Boolean)
    .slice(0, 6) as PosVariant[];

  if (favorites.length === 0 && recents.length === 0) return null;

  const getName = (p: PosVariant) => p.name || p.productName || 'Producto';

  const renderChip = (p: PosVariant, index?: number, isFavorite?: boolean) => (
    <button
      key={p.id}
      type="button"
      className={styles.favChip}
      onClick={() => onSelect(p)}
      title={getName(p)}
    >
      {isFavorite && index !== undefined && (
        <span className={styles.favKey}>F{index + 1}</span>
      )}
      {isFavorite ? <Star size={12} fill="currentColor" /> : <Clock size={12} />}
      <span className={styles.favChipLabel}>{getName(p)}</span>
      <span className={styles.favChipPrice}>{formatCurrency(p.basePrice)}</span>
    </button>
  );

  return (
    <div className={styles.favoritesBar}>
      {favorites.length > 0 && (
        <div className={styles.favSection}>
          <span className={styles.favSectionTitle}>Favoritos</span>
          <div className={styles.favChips}>
            {favorites.slice(0, 8).map((p, i) => renderChip(p, i, true))}
          </div>
        </div>
      )}
      {recents.length > 0 && (
        <div className={styles.favSection}>
          <span className={styles.favSectionTitle}>Recientes</span>
          <div className={styles.favChips}>
            {recents.map(p => renderChip(p))}
          </div>
        </div>
      )}
    </div>
  );
}
