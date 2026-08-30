import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { Button } from '@/components/ui';
import { Search, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import styles from './ProductFormWidgets.module.css';

interface ComboLine {
  id?: string;
  childVariantId: string;
  quantity: number;
  productName?: string;
  variantSku?: string;
  basePrice?: number;
  childVariant?: any;
}

interface Props {
  lines: ComboLine[];
  onChange: (lines: ComboLine[]) => void;
}

export function ComboRecipeBuilder({ lines, onChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: variants } = useQuery({
    queryKey: ['variants-search', searchTerm],
    queryFn: () => productsApi.getVariants(searchTerm),
    enabled: searchTerm.length > 2,
  });

  const addVariant = (v: any) => {
    if (lines.find(l => l.childVariantId === v.id)) return;
    const name = v.product?.name
      ? `${v.product.name}${v.size ? ` - ${v.size}` : ''}${v.color ? ` - ${v.color}` : ''}`
      : (v.sku || 'Componente');

    onChange([...lines, {
      childVariantId: v.id,
      quantity: 1,
      productName: name,
      variantSku: v.sku,
      basePrice: v.basePrice || 0,
      childVariant: v,
    }]);
    setSearchTerm('');
  };

  const removeLine = (index: number) => {
    const newLines = [...lines];
    newLines.splice(index, 1);
    onChange(newLines);
  };

  const updateQuantity = (index: number, qty: number) => {
    if (qty < 1) return;
    const newLines = [...lines];
    newLines[index].quantity = qty;
    onChange(newLines);
  };

  const totalCost = lines.reduce((sum, l) => {
    const price = l.basePrice ?? l.childVariant?.basePrice ?? 0;
    return sum + (price * l.quantity);
  }, 0);

  return (
    <div className={styles.stack}>
      <p className={styles.hint}>
        Agrega los productos que componen este Combo/Kit. Al venderse, se descontará el stock de cada componente automáticamente.
      </p>

      <div className={styles.searchWrap}>
        <div className={styles.searchRow}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o SKU para agregar al combo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {searchTerm.length > 2 && variants && (
          <div className={styles.dropdown}>
            {variants.length === 0 ? (
              <div className={styles.dropdownEmpty}>No se encontraron productos</div>
            ) : (
              variants.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => addVariant(v)}
                  className={styles.dropdownItem}
                >
                  <div>
                    <span className={styles.dropdownItemName}>
                      {v.product?.name} {v.size ? `- ${v.size}` : ''} {v.color ? `- ${v.color}` : ''}
                    </span>
                    <div className={styles.dropdownMeta}>SKU: {v.sku} | Stock: {v.stockLevels?.[0]?.availableQuantity || 0}</div>
                  </div>
                  <Plus size={16} color="var(--accent)" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th className={styles.thCenter}>Cantidad</th>
                <th className={styles.thRight}>Subtotal Base</th>
                <th className={styles.thAction}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const compName = l.productName || l.childVariant?.product?.name || 'Producto Variante';
                const compSku = l.variantSku || l.childVariant?.sku || '';
                const compPrice = l.basePrice ?? l.childVariant?.basePrice ?? 0;
                const subtotal = compPrice * l.quantity;

                return (
                  <tr key={l.id || l.childVariantId || i}>
                    <td>
                      <div className={styles.cellName}>{compName}</div>
                      {compSku && <div className={styles.cellSku}>{compSku}</div>}
                    </td>
                    <td className={styles.tdCenter}>
                      <input 
                        type="number" 
                        min="1"
                        value={l.quantity} 
                        onChange={(e) => updateQuantity(i, Number(e.target.value))}
                        className={styles.qtyInput}
                      />
                    </td>
                    <td className={styles.tdRight}>
                      ${subtotal.toLocaleString()}
                    </td>
                    <td className={styles.tdRight}>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--red)" />} onClick={() => removeLine(i)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className={styles.tfootLabel}>Costo Base Total Componentes:</td>
                <td colSpan={2}>${totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
