import { Drawer, Badge } from '@/components/ui';
import type { ProductVariant } from '@/types';
import { Package, Barcode } from 'lucide-react';
import { VariantPricingPanel } from './VariantPricingPanel';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';


interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant | null;
}

export function VariantDetailDrawer({ open, onClose, variant }: Props) {
  if (!variant) return null;


  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Variante" width="sm">
      <div className={styles.stack}>
        
        <div className={styles.variantHero}>
          <Package size={48} color="var(--accent)" className={styles.variantHeroIcon} />
          <h3 className={styles.variantHeroTitle}>{variant.sku}</h3>
          <p className={styles.variantHeroMeta}>
            {variant.isActive ? <Badge color="green">Activa</Badge> : <Badge color="gray">Inactiva</Badge>}
          </p>
        </div>

        <div className={`grid-responsive grid-cols-2 ${styles.infoGrid}`}>
          <InfoBox label="Talle / Tamaño" value={variant.size || '-'} />
          <InfoBox label="Color" value={variant.color || '-'} />
          <InfoBox label="Precio Base" value={formatCurrency(variant.basePrice)} />
        </div>

        {variant.barcode && (
          <div className={styles.barcodePanel}>
            <Barcode size={32} color="#000" className={styles.barcodeIcon} />
            <p className={styles.barcodeLabel}>Código de Barras</p>
            <p className={styles.barcodeValue}>{variant.barcode}</p>
          </div>
        )}

        <VariantPricingPanel variantId={variant.id} basePrice={variant.basePrice} />

      </div>
    </Drawer>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoCardVertical}>
      <span className={styles.infoCardVerticalLabel}>{label}</span>
      <span className={styles.infoCardVerticalValue}>{value}</span>
    </div>
  );
}
