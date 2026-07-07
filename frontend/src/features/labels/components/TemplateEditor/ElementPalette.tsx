import styles from './TemplateEditor.module.css';
import type { LabelElementType, LabelField } from '../../types/label.types';
import { FIELD_LABELS } from '../../types/label.types';
import { Type, Barcode, QrCode, Image, AlignLeft } from 'lucide-react';

interface PaletteItem {
  type: LabelElementType;
  field?: LabelField;
  label: string;
  icon: React.ReactNode;
}

const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'TEXT', field: 'storeName', label: FIELD_LABELS.storeName, icon: <Type size={14} /> },
  { type: 'TEXT', field: 'productName', label: FIELD_LABELS.productName, icon: <Type size={14} /> },
  { type: 'TEXT', field: 'sizeColor', label: FIELD_LABELS.sizeColor, icon: <Type size={14} /> },
  { type: 'TEXT', field: 'price', label: FIELD_LABELS.price, icon: <Type size={14} /> },
  { type: 'TEXT', field: 'brand', label: FIELD_LABELS.brand, icon: <Type size={14} /> },
  { type: 'TEXT', field: 'custom', label: FIELD_LABELS.custom, icon: <AlignLeft size={14} /> },
  { type: 'BARCODE', field: 'barcode', label: 'Código de barras', icon: <Barcode size={14} /> },
  { type: 'QR', field: 'barcode', label: 'Código QR', icon: <QrCode size={14} /> },
  { type: 'IMAGE', field: 'logo', label: FIELD_LABELS.logo, icon: <Image size={14} /> },
];

interface Props {
  onAdd: (item: PaletteItem) => void;
}

export function ElementPalette({ onAdd }: Props) {
  return (
    <div className={styles.palette}>
      <h3 className={styles.panelTitle}>Elementos</h3>
      <div className={styles.paletteGrid}>
        {PALETTE_ITEMS.map((item) => (
          <button
            key={`${item.type}-${item.field}`}
            type="button"
            className={styles.paletteItem}
            onClick={() => onAdd(item)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { PaletteItem };
