import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag, Package, History, Info } from 'lucide-react';

import { 
  PageContainer, Section, Table, Input, Badge, 
  EmptyState, TableSkeleton 
} from '@/components/ui';

import { posApi } from '@/api/pos.api';
import type { ProductVariant } from '@/types';

export default function PriceInquiryPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['price-inquiry', debouncedSearch],
    queryFn: () => posApi.searchProduct(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
  });

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <PageContainer 
      title="Consulta de Precios" 
      subtitle="Buscá rápidamente precios y disponibilidad de cualquier producto sin abrir el POS."
    >
      <div style={{ marginBottom: '24px', maxWidth: '600px' }}>
        <Input 
          placeholder="Escaneá un código o buscá por SKU / Nombre..." 
          icon={<Search size={20} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                render: (v: any) => {
                  const imgUrl = v.imageUrl || (v.product?.images && v.product.images.length > 0 ? v.product.images[0] : null);
                  return (
                    <div 
                      style={{ 
                        width: '48px', height: '48px', borderRadius: '8px', background: 'var(--bg-elevated)', 
                        overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', cursor: imgUrl ? 'zoom-in' : 'default' 
                      }}
                      onClick={() => imgUrl && setPreviewImage(imgUrl)}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} alt={v.sku} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Package size={20} color="var(--text-muted)" />
                      )}
                    </div>
                  );
                }
              },
              { 
                key: 'product', 
                header: 'Producto',
                render: (v: any) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{v.product?.name || 'Producto Desconocido'}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{v.sku}</span>
                  </div>
                )
              },
              { 
                key: 'attributes', 
                header: 'Talle / Color',
                render: (v: any) => (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {v.size && <Badge color="gray">{v.size}</Badge>}
                    {v.color && <Badge color="blue">{v.color}</Badge>}
                    {!v.size && !v.color && <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Única</span>}
                  </div>
                )
              },
              { 
                key: 'price', 
                header: 'Precio al Público',
                render: (v: any) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--blue)' }}>
                      {fmtCurrency(v.basePrice || 0)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Iva Incluido</span>
                  </div>
                )
              },
              { 
                key: 'stock', 
                header: 'Disponibilidad Total',
                render: (v: any) => {
                  const totalStock = v.stockLevels?.reduce((acc: number, s: any) => acc + s.availableQuantity, 0) || 0;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: totalStock > 0 ? 'var(--green)' : 'var(--red)' }}>
                        {totalStock} unidades
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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

      {/* Image Preview Overlay */}
      {previewImage && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' 
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} 
          />
          <button 
            style={{ 
              position: 'absolute', top: '20px', right: '20px', background: 'white', 
              border: 'none', borderRadius: '50%', width: '40px', height: '40px', 
              cursor: 'pointer', fontWeight: 'bold', fontSize: '20px' 
            }}
            onClick={() => setPreviewImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </PageContainer>
  );
}
