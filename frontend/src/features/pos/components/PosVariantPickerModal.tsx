import { Modal, Button } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ProductVariant } from '@/types';
import styles from '@/pages/pos/POSPage.module.css';

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
      <div className={styles.variantList}>
        {variants.map(v => (
          <button
            key={v.id}
            type="button"
            onClick={() => { onSelect(v); onClose(); }}
            className={styles.variantOption}
          >
            <div>
              <div className={styles.variantName}>{getName(v)}</div>
              <div className={styles.variantMeta}>
                {[v.size, v.color, v.sku].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div className={styles.variantPrice}>{formatCurrency(v.basePrice)}</div>
          </button>
        ))}
      </div>
      <Button variant="ghost" onClick={onClose} className={styles.variantCancel}>Cancelar</Button>
    </Modal>
  );
}
