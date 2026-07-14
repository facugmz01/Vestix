import { X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';

export type PurchaseLineDraft = {
  variantId: string;
  variantSku: string;
  quantity: number;
  unitCost: number;
  discount: number;
};

type Props = {
  lines: PurchaseLineDraft[];
  showLineDiscount?: boolean;
  onChange: (lines: PurchaseLineDraft[]) => void;
};

export function PurchaseSelectedLines({ lines, showLineDiscount = true, onChange }: Props) {
  const updateLine = (idx: number, field: 'quantity' | 'unitCost' | 'discount', value: number) => {
    onChange(lines.map((line, i) => {
      if (i !== idx) return line;
      if (field === 'quantity' && value < 1) return line;
      if ((field === 'unitCost' || field === 'discount') && value < 0) return line;
      return { ...line, [field]: value };
    }));
  };

  const removeLine = (idx: number) => onChange(lines.filter((_, i) => i !== idx));

  if (lines.length === 0) {
    return (
      <div className={styles.selectedLinesEmpty}>
        <p className={styles.selectedLinesEmptyTitle}>Artículos seleccionados</p>
        <p className={styles.selectedLinesEmptyHint}>
          Buscá en el catálogo y hacé clic para agregarlos. Acá vas a cargar cantidades y costos.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.selectedLinesPanel}>
      <div className={styles.selectedLinesHeader}>
        <h3 className={styles.selectedLinesTitle}>Artículos seleccionados ({lines.length})</h3>
        <p className={styles.selectedLinesHint}>Ajustá cantidades y costos acá mientras seguís agregando del catálogo.</p>
      </div>

      <div className={styles.selectedLinesTableHead} aria-hidden>
        <span>Artículo</span>
        <span>Cant.</span>
        <span>Costo U.</span>
        {showLineDiscount && <span>Desc.</span>}
        <span>Subtotal</span>
        <span />
      </div>

      <div className={styles.selectedLinesList}>
        {lines.map((l, i) => {
          const lineTotal = Math.max(0, l.unitCost * l.quantity - (l.discount || 0));
          return (
            <div
              key={`${l.variantId}-${i}`}
              className={`${styles.selectedLineRow} ${showLineDiscount ? styles.selectedLineRowWithDiscount : ''}`}
            >
              <div className={styles.selectedLineName}>
                <span className={styles.selectedLineLabel}>{l.variantSku}</span>
              </div>
              <div>
                <label className={styles.inputLabelSm} htmlFor={`po-qty-${i}`}>Cant.</label>
                <input
                  id={`po-qty-${i}`}
                  type="number"
                  min="1"
                  value={l.quantity}
                  onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                  className={`${styles.inputSm} ${styles.selectedLineQty}`}
                />
              </div>
              <div>
                <label className={styles.inputLabelSm} htmlFor={`po-cost-${i}`}>Costo U.</label>
                <div className={styles.costInputWrap}>
                  <span className={styles.costPrefix}>$</span>
                  <input
                    id={`po-cost-${i}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={l.unitCost}
                    onChange={e => updateLine(i, 'unitCost', Number(e.target.value))}
                    className={`${styles.inputSm} ${styles.inputSmWithPrefix}`}
                  />
                </div>
              </div>
              {showLineDiscount && (
                <div>
                  <label className={styles.inputLabelSm} htmlFor={`po-disc-${i}`}>Desc.</label>
                  <div className={styles.costInputWrap}>
                    <span className={styles.costPrefix}>$</span>
                    <input
                      id={`po-disc-${i}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.discount}
                      onChange={e => updateLine(i, 'discount', Number(e.target.value))}
                      className={`${styles.inputSm} ${styles.inputSmWithPrefix}`}
                    />
                  </div>
                </div>
              )}
              <div className={styles.selectedLineTotal}>
                {formatCurrency(lineTotal)}
              </div>
              <button
                type="button"
                className={styles.selectedLineRemove}
                onClick={() => removeLine(i)}
                aria-label="Quitar artículo"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
