import { Drawer, Badge, Button } from '@/components/ui';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Package, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import type { Product } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductDetailDrawer({ open, onClose, product }: Props) {
  if (!product) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Ficha Técnica" width="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {product.images && product.images.length > 0 ? (
            <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
              <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
              <ImageIcon size={32} />
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                {product.name}
              </h3>
              <ProductStatusBadge isActive={product.isActive} isPublished={product.isPublished} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <Badge color="gray">Cat ID: {product.categoryId}</Badge>
              {product.brandId && <Badge color="blue">Marca ID: {product.brandId}</Badge>}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              ID Sistema: {product.id}
            </p>
          </div>
        </div>

        {/* Description */}
        <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Descripción Comercial</h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
            {product.description || 'Sin descripción detallada.'}
          </p>
        </div>

        {/* Variants Warning */}
        <div style={{ border: '1px solid var(--accent-muted)', borderLeft: '4px solid var(--accent)', background: 'var(--bg-base)', padding: '16px', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Package size={18} color="var(--accent)" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Gestión de Variantes</h4>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Este es un "Producto Madre". El stock, precios (SKU) y códigos de barra se gestionan a nivel de <strong>Variante</strong> (Color/Talle). Ingresá a la matriz de variantes para administrar el inventario físico.
          </p>
          <Button variant="outline" size="sm" style={{ marginTop: '12px' }} icon={<LinkIcon size={14} />} onClick={() => window.location.href = `/admin/catalog/${product.id}/variants`}>
            Ir a Variantes y Precios
          </Button>
        </div>

      </div>
    </Drawer>
  );
}
