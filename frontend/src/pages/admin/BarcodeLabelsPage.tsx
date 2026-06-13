import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { PageContainer } from '@/components/ui';
import { Button } from '@/components/ui';
import { Search, Plus, Trash2, Printer } from 'lucide-react';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import styles from './BarcodeLabelsPage.module.css';

interface LabelItem {
  id: string; // unique local ID
  variantId: string;
  sku: string;
  barcode?: string;
  productName: string;
  size?: string;
  color?: string;
  basePrice: number;
  quantity: number;
}

export function BarcodeLabelsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: variants, isLoading } = useQuery({
    queryKey: ['variants-search', searchTerm],
    queryFn: () => productsApi.getVariants(searchTerm),
    enabled: searchTerm.length > 2,
  });

  const handleAdd = (v: any) => {
    setLabelItems(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      variantId: v.id,
      sku: v.sku,
      barcode: v.barcode || v.sku, // Fallback a SKU si no hay código de barras
      productName: v.product?.name || 'Producto',
      size: v.size,
      color: v.color,
      basePrice: v.basePrice || 0,
      quantity: 1,
    }]);
    setSearchTerm('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setLabelItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setLabelItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer title="Impresión de Etiquetas">
      <div className={styles.container}>
        <div className={styles.noPrint}>
          <div className={styles.card}>
            <div className={styles.searchSection}>
              <div className={styles.searchInputWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              {searchTerm.length > 2 && variants && (
                <div className={styles.searchResults}>
                  {variants.length === 0 ? (
                    <div className={styles.noResults}>No se encontraron productos</div>
                  ) : (
                    variants.map((v: any) => (
                      <div key={v.id} className={styles.searchResultItem} onClick={() => handleAdd(v)}>
                        <div className={styles.searchResultInfo}>
                          <span className={styles.searchResultName}>{v.product?.name} {v.size ? `- ${v.size}` : ''} {v.color ? `- ${v.color}` : ''}</span>
                          <span className={styles.searchResultSku}>SKU: {v.sku}</span>
                        </div>
                        <Plus size={18} className={styles.addIcon} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {labelItems.length > 0 && (
              <div className={styles.itemsTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU / Código</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labelItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className={styles.itemName}>{item.productName}</div>
                          <div className={styles.itemAttributes}>
                            {[item.size, item.color].filter(Boolean).join(' - ')}
                          </div>
                        </td>
                        <td>{item.barcode || item.sku}</td>
                        <td>
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => updateQuantity(item.id, -1)}>-</button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)}>+</button>
                          </div>
                        </td>
                        <td>
                          <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={() => removeItem(item.id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className={styles.actions}>
                  <Button variant="primary" icon={<Printer size={16} />} onClick={handlePrint}>
                    Imprimir Etiquetas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRINT LAYOUT */}
        <div className={styles.printArea} ref={printRef}>
          {labelItems.flatMap(item => 
            Array.from({ length: item.quantity }).map((_, index) => (
              <div key={`${item.id}-${index}`} className={styles.label}>
                <div className={styles.labelHeader}>Vestix ERP</div>
                <div className={styles.labelProductName}>{item.productName}</div>
                <div className={styles.labelAttributes}>{[item.size, item.color].filter(Boolean).join(' - ')}</div>
                
                {/* Fallback visual barcode si no hay librería real de códigos */}
                <div className={styles.barcodeVisual}>
                  {item.barcode || item.sku}
                </div>
                
                <div className={styles.labelPrice}>${item.basePrice.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
}
