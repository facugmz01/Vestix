import { Drawer, Badge } from '@/components/ui';
import type { ProductVariant } from '@/types';
import { Package, Barcode } from 'lucide-react';
import { VariantPricingPanel } from './VariantPricingPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant | null;
}

export function VariantDetailDrawer({ open, onClose, variant }: Props) {
  if (!variant) return null;

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Variante" width="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <Package size={48} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, fontFamily: 'monospace' }}>{variant.sku}</h3>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
            {variant.isActive ? <Badge color="green">Activa</Badge> : <Badge color="gray">Inactiva</Badge>}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <InfoBox label="Talle / Tamaño" value={variant.size || '-'} />
          <InfoBox label="Color" value={variant.color || '-'} />
          <InfoBox label="Precio Base" value={fmtCurrency(variant.basePrice)} />
        </div>

        {variant.barcode && (
          <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <Barcode size={32} color="#000" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Código de Barras</p>
            <p style={{ margin: '4px 0 0', fontSize: '16px', color: '#000', fontWeight: 'bold', fontFamily: 'monospace' }}>{variant.barcode}</p>
          </div>
        )}

        <VariantPricingPanel variantId={variant.id} basePrice={variant.basePrice} />

      </div>
    </Drawer>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
