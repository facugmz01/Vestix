import { Drawer, Badge, Button } from '@/components/ui';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Package, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import type { Product } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import styles from './ProductDetailDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailDrawer({ open, onClose, product }: Props) {
  const { data: fullProduct, isLoading } = useQuery({
    queryKey: ['product', product?.id],
    queryFn: () => productsApi.getProduct(product!.id),
    enabled: !!product?.id && open,
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['product-price-history', product?.id],
    queryFn: () => productsApi.getPriceHistory(product!.id),
    enabled: !!product?.id && open,
  });

  const displayProduct = fullProduct || product;

  if (!displayProduct) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Ficha Técnica" width="md">
      <div className={styles.stack}>
        <div className={styles.header}>
          {displayProduct.images && displayProduct.images.length > 0 ? (
            <div className={styles.thumb}>
              <img src={displayProduct.images[0]} alt={displayProduct.name} className={styles.thumbImg} />
            </div>
          ) : (
            <div className={styles.thumbEmpty}>
              <ImageIcon size={32} />
            </div>
          )}

          <div className={styles.headerInfo}>
            <div className={styles.headerTop}>
              <h3 className={styles.title}>{displayProduct.name}</h3>
              <ProductStatusBadge isActive={displayProduct.isActive} isPublished={displayProduct.isPublished} />
            </div>

            <div className={styles.badges}>
              <Badge color="gray">{(displayProduct as any).category?.name || `Cat: ${displayProduct.categoryId}`}</Badge>
              {displayProduct.brandId && (
                <Badge color="blue">{displayProduct.brand?.name || `Marca: ${displayProduct.brandId}`}</Badge>
              )}
            </div>
            <p className={styles.meta}>ID Sistema: {displayProduct.id}</p>
          </div>
        </div>

        <div className={styles.sectionMuted}>
          <h4 className={styles.sectionTitle}>Descripción Comercial</h4>
          <p className={styles.description}>
            {displayProduct.description || 'Sin descripción detallada.'}
          </p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Package size={18} color="var(--accent)" />
            <h4 className={styles.sectionTitleLg}>Variantes y Precios</h4>
          </div>

          {isLoading ? (
            <p className={styles.emptyText}>Cargando variantes...</p>
          ) : displayProduct.variants && displayProduct.variants.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Color</th>
                    <th>Talle</th>
                    <th className={styles.thRight}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProduct.variants.map((v) => (
                    <tr key={v.id}>
                      <td>{v.sku}</td>
                      <td>{v.color || '-'}</td>
                      <td>{v.size || '-'}</td>
                      <td className={styles.tdRight}>${v.basePrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyText}>Este producto no tiene variantes configuradas.</p>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={styles.fullWidthBtn}
            icon={<LinkIcon size={14} />}
            onClick={() => { window.location.href = `/admin/catalog/${displayProduct.id}/variants`; }}
          >
            Administrar Inventario Completo
          </Button>
        </div>

        {priceHistory && priceHistory.length > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitleLg}>Historial de precios</h4>
            <div className={styles.historyList}>
              {priceHistory.slice(0, 10).map(h => (
                <div key={h.id} className={styles.historyRow}>
                  <span>{h.sku || h.variantId.slice(0, 8)} · {h.source}</span>
                  <span>{h.oldPrice} → <strong>{h.newPrice}</strong></span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
