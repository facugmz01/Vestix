import { useState } from 'react';
import { Drawer, Button, Input } from '@/components/ui';
import { BulkPrintLabelsModal } from '@/features/labels/components/BulkPrintLabelsModal';
import { Printer } from 'lucide-react';
import type { ProductVariant } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant | null;
}

export function PrintLabelsModal({ open, onClose, variant }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);

  if (!variant) return null;

  return (
    <>
      <Drawer
        open={open && !bulkOpen}
        onClose={onClose}
        title="Impresión de Etiquetas"
        width="sm"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" icon={<Printer size={16} />} onClick={() => setBulkOpen(true)}>
              Continuar ({quantity})
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Variante:</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{variant.sku}</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Cód. de Barras: {variant.barcode || 'No posee'}</p>
          </div>

          {!variant.barcode && (
            <div style={{ padding: '12px', background: 'var(--yellow-bg)', color: 'var(--yellow)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
              Sin código de barras asignado. Se generará automáticamente si está habilitado en configuración.
            </div>
          )}

          <Input
            label="Cantidad de etiquetas"
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
      </Drawer>

      <BulkPrintLabelsModal
        open={bulkOpen}
        onClose={() => { setBulkOpen(false); onClose(); }}
        items={[{ variantId: variant.id, sku: variant.sku, quantity }]}
        title={`Etiquetas: ${variant.sku}`}
      />
    </>
  );
}
