import { Drawer, Badge, Button } from '@/components/ui';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Package, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import type { Product } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';

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

  const displayProduct = fullProduct || product;

  if (!displayProduct) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Ficha Técnica" width="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {displayProduct.images && displayProduct.images.length > 0 ? (
            <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
              <img src={displayProduct.images[0]} alt={displayProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
              <ImageIcon size={32} />
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {displayProduct.name}
              </h3>
              <ProductStatusBadge isActive={displayProduct.isActive} isPublished={displayProduct.isPublished} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Badge color="gray">{displayProduct.category?.name || `Cat: ${displayProduct.categoryId}`}</Badge>
              {displayProduct.brandId && <Badge color="blue">{displayProduct.brand?.name || `Marca: ${displayProduct.brandId}`}</Badge>}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              ID Sistema: {displayProduct.id}
            </p>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Descripción Comercial</h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
            {displayProduct.description || 'Sin descripción detallada.'}
          </p>
        </div>

        {/* Variants */}
        <div style={{ border: '1px solid var(--border)', background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Package size={18} color="var(--accent)" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Variantes y Precios</h4>
          </div>

          {isLoading ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Cargando variantes...</p>
          ) : displayProduct.variants && displayProduct.variants.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)' }}>SKU</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)' }}>Color</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--text-secondary)' }}>Talle</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--text-secondary)' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {displayProduct.variants.map((v) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 4px' }}>{v.sku}</td>
                      <td style={{ padding: '8px 4px' }}>{v.color || '-'}</td>
                      <td style={{ padding: '8px 4px' }}>{v.size || '-'}</td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600 }}>${v.basePrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Este producto no tiene variantes configuradas.</p>
          )}

          <Button variant="ghost" size="sm" style={{ marginTop: '16px', width: '100%' }} icon={<LinkIcon size={14} />} onClick={() => window.location.href = `/admin/catalog/${displayProduct.id}/variants`}>
            Administrar Inventario Completo
          </Button>
        </div>

      </div>
    </Drawer>
  );
}
