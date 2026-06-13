import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { Button } from '@/components/ui';
import { Search, Plus, Trash2 } from 'lucide-react';

interface ComboLine {
  childVariantId: string;
  quantity: number;
  productName?: string;
  variantSku?: string;
  basePrice?: number;
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
    onChange([...lines, {
      childVariantId: v.id,
      quantity: 1,
      productName: v.product?.name || '',
      variantSku: v.sku,
      basePrice: v.basePrice || 0
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

  const totalCost = lines.reduce((sum, l) => sum + ((l.basePrice || 0) * l.quantity), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        Agrega los productos que componen este Combo/Kit. Al venderse, se descontará el stock de cada componente automáticamente.
      </p>

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0 12px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o SKU para agregar al combo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px 0', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>

        {searchTerm.length > 2 && variants && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginTop: '4px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            {variants.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No se encontraron productos</div>
            ) : (
              variants.map(v => (
                <div 
                  key={v.id} 
                  onClick={() => addVariant(v)}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{v.product?.name} {v.size ? `- ${v.size}` : ''} {v.color ? `- ${v.color}` : ''}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SKU: {v.sku} | Stock: {v.stockLevels?.[0]?.availableQuantity || 0}</span>
                  </div>
                  <Plus size={16} color="var(--brand-primary)" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {lines.length > 0 && (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px' }}>Producto</th>
                <th style={{ textAlign: 'center', padding: '10px', width: '100px' }}>Cantidad</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Subtotal Base</th>
                <th style={{ textAlign: 'right', padding: '10px', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px' }}>
                    <div style={{ fontWeight: 500 }}>{l.productName || 'Producto Variante'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.variantSku}</div>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <input 
                      type="number" 
                      min="1"
                      value={l.quantity} 
                      onChange={(e) => updateQuantity(i, Number(e.target.value))}
                      style={{ width: '60px', padding: '6px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    />
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    ${((l.basePrice || 0) * l.quantity).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} color="var(--red)" />} onClick={() => removeLine(i)} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot style={{ background: 'var(--bg-elevated)' }}>
              <tr>
                <td colSpan={2} style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>Costo Base Total Componentes:</td>
                <td colSpan={2} style={{ padding: '10px', fontWeight: 600 }}>${totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
