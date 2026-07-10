import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag, Package, Info } from 'lucide-react';

import { 
  PageContainer, Section, Table, Input, Badge, EmptyState, TableSkeleton, Tabs
} from '@/components/ui';

import { posApi } from '@/api/pos.api';
import { formatCurrency } from '@/utils/formatCurrency';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from './PriceInquiryPage.module.css';

export default function PriceInquiryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['price-inquiry', debouncedSearch],
    queryFn: () => posApi.searchProduct(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Consulta de Precios" 
      subtitle="Buscá rápidamente precios y disponibilidad de cualquier producto sin abrir el POS."
    >
      <div className={styles.searchSection}>
        <div className={styles.searchRow}>
          <Search size={20} color="var(--text-muted)" />
          <Input 
            placeholder="Escaneá un código o buscá por SKU / Nombre..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <p className={styles.searchHint}>
          <Info size={14} /> Escribí al menos 2 caracteres para buscar.
        </p>
      </div>

      <Section>
        {!debouncedSearch || debouncedSearch.length < 2 ? (
          <EmptyState 
            icon={<Tag size={40} color="var(--text-muted)" />}
            title="Esperando búsqueda" 
            message="Ingresá el nombre de un artículo o escaneá el código de barras para ver el precio al público." 
          />
        ) : isLoading ? (
          <TableSkeleton rows={5} />
        ) : !results || results.length === 0 ? (
          <EmptyState 
            icon={<Package size={40} />}
            title="No se encontraron resultados" 
            message={`No hay productos que coincidan con "${debouncedSearch}".`} 
          />
        ) : (
          <Table
            keyField="id"
            data={results}
            columns={[
              {
                key: 'image',
                header: '',
                render: (v: { imageUrl?: string; sku: string; product?: { images?: string[] } }) => {
                  const imgUrl = v.imageUrl || (v.product?.images && v.product.images.length > 0 ? v.product.images[0] : null);
                  return (
                    <div 
                      className={styles.thumb}
                      onClick={() => imgUrl && setPreviewImage(imgUrl)}
                      role={imgUrl ? 'button' : undefined}
                      tabIndex={imgUrl ? 0 : undefined}
                      onKeyDown={(e) => imgUrl && e.key === 'Enter' && setPreviewImage(imgUrl)}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} alt={v.sku} className={styles.thumbImg} />
                      ) : (
                        <div className={styles.thumbPlaceholder}>
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  );
                }
              },
              { 
                key: 'product', 
                header: 'Producto',
                render: (v: { product?: { name?: string }; sku: string }) => (
                  <div className={adminStyles.cellStack}>
                    <span className={styles.productName}>{v.product?.name || 'Producto Desconocido'}</span>
                    <span className={styles.productSku}>{v.sku}</span>
                  </div>
                )
              },
              { 
                key: 'attributes', 
                header: 'Talle / Color',
                render: (v: { size?: string; color?: string }) => (
                  <div className={styles.badgeRow}>
                    {v.size && <Badge color="gray">{v.size}</Badge>}
                    {v.color && <Badge color="blue">{v.color}</Badge>}
                    {!v.size && !v.color && <span className={adminStyles.expiryMuted}>Única</span>}
                  </div>
                )
              },
              { 
                key: 'price', 
                header: 'Precio al Público',
                render: (v: { basePrice?: number }) => (
                  <div className={adminStyles.cellStack}>
                    <span className={styles.priceValue}>
                      {formatCurrency(v.basePrice || 0)}
                    </span>
                    <span className={adminStyles.cellMutedXs}>Iva Incluido</span>
                  </div>
                )
              },
              { 
                key: 'stock', 
                header: 'Disponibilidad Total',
                render: (v: { stockLevels?: { availableQuantity: number }[] }) => {
                  const totalStock = v.stockLevels?.reduce((acc, s) => acc + s.availableQuantity, 0) || 0;
                  return (
                    <div className={adminStyles.cellStack}>
                      <span className={clsx(styles.stockValue, totalStock > 0 ? styles.stockOk : styles.stockEmpty)}>
                        {totalStock} unidades
                      </span>
                      <span className={adminStyles.cellMutedXs}>
                        En {v.stockLevels?.length || 0} depósitos
                      </span>
                    </div>
                  );
                }
              }
            ]}
          />
        )}
      </Section>

      {previewImage && (
        <div 
          className={styles.lightbox}
          onClick={() => setPreviewImage(null)}
          role="presentation"
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            className={styles.lightboxImg}
          />
          <button 
            type="button"
            className={styles.lightboxClose}
            onClick={() => setPreviewImage(null)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
    </PageContainer>
  );
}
