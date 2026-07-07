import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { labelsApi } from '@/api/labels.api';
import { settingsApi } from '@/api/settings.api';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { PageContainer, Button, Tabs } from '@/components/ui';
import { Search, Plus, Trash2, Printer, FileDown, Eye } from 'lucide-react';
import { LabelRenderer } from '@/features/labels/components/LabelRenderer';
import type { LabelTemplate, LabelPrintData } from '@/features/labels/types/label.types';
import toast from 'react-hot-toast';

import styles from './BarcodeLabelsPage.module.css';

interface LabelItem {
  id: string;
  variantId: string;
  sku: string;
  barcode?: string;
  productName: string;
  size?: string;
  color?: string;
  basePrice: number;
  quantity: number;
}

function toPrintData(item: LabelItem, storeName: string, logoUrl?: string): LabelPrintData {
  return {
    storeName,
    productName: item.productName,
    sku: item.sku,
    barcode: item.barcode || item.sku,
    size: item.size,
    color: item.color,
    price: item.basePrice,
    logoUrl,
  };
}

export default function BarcodeLabelsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [labelItems, setLabelItems] = useState<LabelItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: variants } = useQuery({
    queryKey: ['variants-search', searchTerm],
    queryFn: () => productsApi.getVariants(searchTerm),
    enabled: searchTerm.length > 2,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['labelTemplates'],
    queryFn: () => labelsApi.getTemplates(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const activeTemplate: LabelTemplate | undefined =
    templates.find((t) => t.id === selectedTemplateId) ||
    templates.find((t) => t.isDefault) ||
    templates[0];

  const storeName = settings?.general?.companyName || 'Vestix ERP';
  const logoUrl = settings?.general?.logoUrl;

  const samplePreviewData = useMemo(() => {
    if (labelItems.length === 0) return null;
    return toPrintData(labelItems[0], storeName, logoUrl);
  }, [labelItems, storeName, logoUrl]);

  const handleAdd = (v: {
    id: string;
    sku: string;
    barcode?: string;
    size?: string;
    color?: string;
    basePrice?: number;
    product?: { name?: string };
  }) => {
    setLabelItems((prev) => [...prev, {
      id: Math.random().toString(36).substring(7),
      variantId: v.id,
      sku: v.sku,
      barcode: v.barcode || v.sku,
      productName: v.product?.name || 'Producto',
      size: v.size,
      color: v.color,
      basePrice: v.basePrice || 0,
      quantity: 1,
    }]);
    setSearchTerm('');
  };

  const updateQuantity = (id: string, delta: number) => {
    setLabelItems((prev) => prev.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setLabelItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePrint = () => {
    if (!activeTemplate) {
      toast.error('Seleccioná una plantilla de etiqueta');
      return;
    }
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!activeTemplate || labelItems.length === 0) return;
    try {
      const blob = await labelsApi.printBulk(
        labelItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        activeTemplate.id,
      );
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'labels.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF generado');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar PDF';
      toast.error(message);
    }
  };

  return (
    <PageContainer title="Impresión de Etiquetas">
      <Tabs items={CATALOG_TABS} />

      <div className={styles.container}>
        <div className={styles.noPrint}>
          <div className={styles.card}>
            <div className={styles.toolbar}>
              <div className={styles.templateSelect}>
                <label htmlFor="template-select">Plantilla</label>
                <select
                  id="template-select"
                  value={activeTemplate?.id ?? ''}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  disabled={templates.length === 0}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.labelWidth}×{t.labelHeight} mm){t.isDefault ? ' ★' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {labelItems.length > 0 && (
                <Button variant="ghost" size="sm" icon={<Eye size={16} />} onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
                </Button>
              )}
            </div>

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
                    variants.map((v) => (
                      <div key={v.id} className={styles.searchResultItem} onClick={() => handleAdd(v)}>
                        <div className={styles.searchResultInfo}>
                          <span className={styles.searchResultName}>
                            {v.product?.name} {v.size ? `- ${v.size}` : ''} {v.color ? `- ${v.color}` : ''}
                          </span>
                          <span className={styles.searchResultSku}>SKU: {v.sku}</span>
                        </div>
                        <Plus size={18} className={styles.addIcon} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {showPreview && activeTemplate && samplePreviewData && (
              <div className={styles.previewSection}>
                <LabelRenderer
                  data={samplePreviewData}
                  layout={activeTemplate.layout}
                  widthMm={activeTemplate.labelWidth}
                  heightMm={activeTemplate.labelHeight}
                />
              </div>
            )}

            {labelItems.length > 0 && (
              <div className={styles.itemsTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU / Código</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ width: '50px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {labelItems.map((item) => (
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
                  <Button variant="ghost" icon={<FileDown size={16} />} onClick={handleDownloadPdf}>
                    Descargar PDF
                  </Button>
                  <Button variant="primary" icon={<Printer size={16} />} onClick={handlePrint}>
                    Imprimir etiquetas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTemplate && (
          <div className={styles.printArea} ref={printRef}>
            {labelItems.flatMap((item) =>
              Array.from({ length: item.quantity }).map((_, index) => (
                <LabelRenderer
                  key={`${item.id}-${index}`}
                  data={toPrintData(item, storeName, logoUrl)}
                  layout={activeTemplate.layout}
                  widthMm={activeTemplate.labelWidth}
                  heightMm={activeTemplate.labelHeight}
                />
              )),
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
