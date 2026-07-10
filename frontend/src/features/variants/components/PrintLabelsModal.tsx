import { useState } from 'react';
import { Drawer, Button, Input } from '@/components/ui';
import { BulkPrintLabelsModal } from '@/features/labels/components/BulkPrintLabelsModal';
import { Printer } from 'lucide-react';
import type { ProductVariant } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

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
        <div className={styles.stack}>
          <div className={styles.sectionPanel}>
            <p className={styles.variantInfoLabel}>Variante:</p>
            <p className={styles.variantInfoSku}>{variant.sku}</p>
            <p className={styles.variantInfoBarcode}>Cód. de Barras: {variant.barcode || 'No posee'}</p>
          </div>

          {!variant.barcode && (
            <div className={styles.alertYellow}>
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
