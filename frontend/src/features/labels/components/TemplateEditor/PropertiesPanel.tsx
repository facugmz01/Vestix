import { Input, ToggleSwitch } from '@/components/ui';
import type { LabelElement, LabelField, BarcodeSymbology } from '../../types/label.types';
import { FIELD_LABELS } from '../../types/label.types';
import styles from './TemplateEditor.module.css';

interface Props {
  element: LabelElement | null;
  onChange: (element: LabelElement) => void;
  onDelete: () => void;
  barcodeSymbology: BarcodeSymbology;
  onBarcodeSymbologyChange: (v: BarcodeSymbology) => void;
  priceSource: 'BASE' | 'PRICE_LIST';
  onPriceSourceChange: (v: 'BASE' | 'PRICE_LIST') => void;
  priceListId?: string;
  onPriceListIdChange: (v: string) => void;
  priceLists: { id: string; name: string }[];
}

const FIELD_OPTIONS: LabelField[] = [
  'storeName', 'productName', 'sku', 'barcode', 'size', 'color',
  'sizeColor', 'price', 'brand', 'category', 'logo', 'custom',
];

export function PropertiesPanel({
  element,
  onChange,
  onDelete,
  barcodeSymbology,
  onBarcodeSymbologyChange,
  priceSource,
  onPriceSourceChange,
  priceListId,
  onPriceListIdChange,
  priceLists,
}: Props) {
  if (!element) {
    return (
      <div className={styles.properties}>
        <h3 className={styles.panelTitle}>Propiedades</h3>
        <p className={styles.hint}>Seleccioná un elemento del lienzo para editarlo.</p>

        <div className={styles.section}>
          <label className={styles.label}>Símbolo de barras</label>
          <select
            className={styles.select}
            value={barcodeSymbology}
            onChange={(e) => onBarcodeSymbologyChange(e.target.value as BarcodeSymbology)}
          >
            <option value="EAN13">EAN-13</option>
            <option value="CODE128">CODE-128</option>
            <option value="QR">QR</option>
            <option value="NONE">Sin código</option>
          </select>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>Fuente de precio</label>
          <select
            className={styles.select}
            value={priceSource}
            onChange={(e) => onPriceSourceChange(e.target.value as 'BASE' | 'PRICE_LIST')}
          >
            <option value="BASE">Precio base</option>
            <option value="PRICE_LIST">Lista de precios</option>
          </select>
          {priceSource === 'PRICE_LIST' && (
            <select
              className={styles.select}
              style={{ marginTop: 8 }}
              value={priceListId ?? ''}
              onChange={(e) => onPriceListIdChange(e.target.value)}
            >
              <option value="">Seleccionar lista...</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>{pl.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  const patch = (partial: Partial<LabelElement>) => onChange({ ...element, ...partial });

  return (
    <div className={styles.properties}>
      <h3 className={styles.panelTitle}>Propiedades</h3>
      <p className={styles.elementType}>{element.type}</p>

      {element.type === 'TEXT' && (
        <>
          <div className={styles.section}>
            <label className={styles.label}>Campo</label>
            <select
              className={styles.select}
              value={element.field ?? 'custom'}
              onChange={(e) => patch({ field: e.target.value as LabelField })}
            >
              {FIELD_OPTIONS.filter((f) => f !== 'logo').map((f) => (
                <option key={f} value={f}>{FIELD_LABELS[f]}</option>
              ))}
            </select>
          </div>
          {element.field === 'custom' && (
            <Input
              label="Texto"
              value={element.customText ?? ''}
              onChange={(e) => patch({ customText: e.target.value })}
            />
          )}
          <Input label="Tamaño fuente" type="number" min={4} max={24} value={element.fontSize ?? 8} onChange={(e) => patch({ fontSize: Number(e.target.value) })} />
          <div className={styles.section}>
            <label className={styles.label}>Peso</label>
            <select className={styles.select} value={element.fontWeight ?? 'normal'} onChange={(e) => patch({ fontWeight: e.target.value as 'normal' | 'bold' })}>
              <option value="normal">Normal</option>
              <option value="bold">Negrita</option>
            </select>
          </div>
          <div className={styles.section}>
            <label className={styles.label}>Alineación</label>
            <select className={styles.select} value={element.textAlign ?? 'left'} onChange={(e) => patch({ textAlign: e.target.value as 'left' | 'center' | 'right' })}>
              <option value="left">Izquierda</option>
              <option value="center">Centro</option>
              <option value="right">Derecha</option>
            </select>
          </div>
        </>
      )}

      <div className={styles.grid2}>
        <Input label="X (mm)" type="number" step="0.5" value={element.x} onChange={(e) => patch({ x: Number(e.target.value) })} />
        <Input label="Y (mm)" type="number" step="0.5" value={element.y} onChange={(e) => patch({ y: Number(e.target.value) })} />
        <Input label="Ancho (mm)" type="number" step="0.5" value={element.width ?? ''} onChange={(e) => patch({ width: Number(e.target.value) })} />
        <Input label="Alto (mm)" type="number" step="0.5" value={element.height ?? ''} onChange={(e) => patch({ height: Number(e.target.value) })} />
      </div>

      <ToggleSwitch label="Visible" checked={element.visible} onChange={(e) => patch({ visible: e.target.checked })} />

      <button type="button" className={styles.deleteBtn} onClick={onDelete}>
        Eliminar elemento
      </button>
    </div>
  );
}
