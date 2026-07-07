import { Modal, Button } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ProductVariant } from '@/types';

type PosVariant = ProductVariant & { name?: string; productName?: string; size?: string; color?: string };

export function PosVariantPickerModal({
  open,
  variants,
  onSelect,
  onClose,
}: {
  open: boolean;
  variants: PosVariant[];
  onSelect: (v: PosVariant) => void;
  onClose: () => void;
}) {
  const getName = (p: PosVariant) => p.name || p.productName || 'Producto';

  return (
    <Modal open={open} onClose={onClose} title="Seleccionar variante">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
        {variants.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => { onSelect(v); onClose(); }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
              cursor: 'pointer', color: '#fff', textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{getName(v)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {[v.size, v.color, v.sku].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div style={{ fontWeight: 700, color: '#34d399' }}>{formatCurrency(v.basePrice)}</div>
          </button>
        ))}
      </div>
      <Button variant="ghost" onClick={onClose} style={{ marginTop: '16px', width: '100%' }}>Cancelar</Button>
    </Modal>
  );
}
