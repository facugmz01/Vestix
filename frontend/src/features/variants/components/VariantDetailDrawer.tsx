import { Drawer, Badge } from '@/components/ui';
import type { ProductVariant } from '@/types';
import { Package, Barcode, Warehouse } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { VariantPricingPanel } from './VariantPricingPanel';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant | null;
}

export function VariantDetailDrawer({ open, onClose, variant }: Props) {
  const { data: stockLevels, isLoading: loadingStock } = useQuery({
    queryKey: ['variant-stock', variant?.id],
    queryFn: () => inventoryApi.getStockByVariant(variant!.id),
    enabled: !!variant?.id && open,
  });

  if (!variant) return null;

  const totalAvailable = (stockLevels ?? []).reduce((sum, s) => sum + s.availableQuantity, 0);
  const totalPhysical = (stockLevels ?? []).reduce((sum, s) => sum + s.physicalQuantity, 0);
  const totalReserved = (stockLevels ?? []).reduce((sum, s) => sum + s.reservedQuantity, 0);

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

        <div className="grid-responsive grid-cols-2" style={{ gap: "12px" }}>
          <InfoBox label="Talle / Tamaño" value={variant.size || '-'} />
          <InfoBox label="Color" value={variant.color || '-'} />
          <InfoBox label="Precio Base" value={formatCurrency(variant.basePrice)} />
          <InfoBox
            label="Stock disponible"
            value={loadingStock ? '...' : totalAvailable}
          />
        </div>

        {!loadingStock && stockLevels && stockLevels.length > 0 && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Warehouse size={16} color="var(--accent)" />
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Stock por depósito</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stockLevels.map(level => (
                <div
                  key={level.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {level.warehouseName}
                    {level.branchName ? ` · ${level.branchName}` : ''}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {level.availableQuantity} disp.
                    {level.reservedQuantity > 0 ? ` (${level.reservedQuantity} res.)` : ''}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: '12px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
              Total físico: {totalPhysical} · Reservado: {totalReserved}
            </p>
          </div>
        )}

        {variant.attributes && Object.keys(variant.attributes).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(variant.attributes).map(([key, value]) => (
              <Badge key={key} color="gray">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )}

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
