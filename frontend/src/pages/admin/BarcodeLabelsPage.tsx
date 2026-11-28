import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { labelsApi, type LabelCatalogVariant } from '@/api/labels.api';
import { productsApi } from '@/api/products.api';
import { settingsApi } from '@/api/settings.api';
import { PageContainer, Button } from '@/components/ui';
import { Printer, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { LabelRenderer } from '@/features/labels/components/LabelRenderer';
import type { LabelTemplate, LabelPrintData } from '@/features/labels/types/label.types';
import toast from 'react-hot-toast';
import styles from './BarcodeLabelsPage.module.css';

interface SelectedItem {
  variant: LabelCatalogVariant;
  quantity: number;
}

function toPrintData(variant: LabelCatalogVariant, storeName: string, logoUrl?: string): LabelPrintData {
  return {
    storeName,
    productName: variant.product.name,
    sku: variant.sku,
    barcode: variant.barcode || variant.sku,
    size: variant.size || undefined,
    color: variant.color || undefined,
    price: Number(variant.basePrice) || 0,
    logoUrl,
  };
}

export default function BarcodeLabelsPage() {
  const printAreaRef = useRef<HTMLElement>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [templateId, setTemplateId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const pageSize = 50;

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['labelCatalog', search, categoryId, brandId, page],
    queryFn: () => labelsApi.getCatalog(search, page, pageSize, { categoryId: categoryId || undefined, brandId: brandId || undefined }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'], queryFn: () => productsApi.getCategories(),
  });
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'], queryFn: () => productsApi.getBrands(),
  });
  const { data: templates = [] } = useQuery({
    queryKey: ['labelTemplates'], queryFn: () => labelsApi.getTemplates(),
  });
  const { data: settings } = useQuery({
    queryKey: ['settings'], queryFn: () => settingsApi.getSettings(),
  });

  const activeTemplate: LabelTemplate | undefined =
    templates.find((template) => template.id === templateId) ||
    templates.find((template) => template.name === 'Detonger P1 40×30 mm') ||
    templates.find((template) => template.isDefault) || templates[0];
  const selectedItems = Object.values(selected);
  const totalLabels = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPages = Math.max(1, Math.ceil((catalog?.total ?? 0) / pageSize));
  const storeName = settings?.general?.companyName || 'Vestix ERP';
  const logoUrl = settings?.general?.logoUrl;

  const printItems = useMemo(
    () => selectedItems.filter((item) => item.quantity > 0),
    [selected],
  );

  const toggleVariant = (variant: LabelCatalogVariant, checked: boolean) => {
    setSelected((current) => {
      if (!checked) {
        const next = { ...current };
        delete next[variant.id];
        return next;
      }
      return {
        ...current,
        [variant.id]: { variant, quantity: Math.max(0, Math.floor(variant.stock.available || 0)) },
      };
    });
  };

  const updateQuantity = (variant: LabelCatalogVariant, value: string) => {
    const quantity = value === '' ? 0 : Math.max(0, Math.floor(Number(value) || 0));
    setSelected((current) => ({ ...current, [variant.id]: { variant, quantity } }));
  };

  const printLabels = () => {
    if (!activeTemplate) {
      toast.error('No hay una plantilla de etiqueta configurada');
      return;
    }
    if (!printItems.length) {
      toast.error('Seleccioná productos con cantidad mayor a cero');
      return;
    }
    const labels = printAreaRef.current?.children;
    if (!labels?.length) {
      toast.error('No se pudieron preparar las etiquetas para imprimir');
      return;
    }

    // Print from an isolated document so the ERP layout cannot collapse the
    // label page breaks into one long page in Chromium/thermal printer drivers.
    const frame = document.createElement('iframe');
    frame.title = 'Impresión de etiquetas';
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    document.body.appendChild(frame);
    const frameDocument = frame.contentDocument;
    if (!frameDocument) {
      frame.remove();
      toast.error('No se pudo abrir el documento de impresión');
      return;
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((style) => style.outerHTML)
      .join('\n');
    const pageStyle = `<style>
      @page { size: ${activeTemplate.labelWidth}mm ${activeTemplate.labelHeight}mm; margin: 0; }
      html, body { width: ${activeTemplate.labelWidth}mm; margin: 0 !important; padding: 0 !important; }
      .label-page { display: block !important; width: ${activeTemplate.labelWidth}mm !important; height: ${activeTemplate.labelHeight}mm !important; margin: 0 !important; padding: 0 !important; overflow: hidden; break-inside: avoid; page-break-inside: avoid; break-after: page; page-break-after: always; }
      .label-page:last-child { break-after: auto; page-break-after: auto; }
      @media screen { body { padding: 12px !important; } .label-page { outline: 1px dashed #aaa; } }
    </style>`;
    const pageMarkup = Array.from(labels)
      .map((label) => `<div class="label-page">${label.outerHTML}</div>`)
      .join('');
    frameDocument.open();
    frameDocument.write(`<!doctype html><html><head><meta charset="utf-8">${styles}${pageStyle}</head><body>${pageMarkup}</body></html>`);
    frameDocument.close();

    const printFrame = () => {
      if (frame.dataset.printStarted) return;
      frame.dataset.printStarted = 'true';
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    };
    frame.contentWindow?.addEventListener('afterprint', () => frame.remove(), { once: true });
    frame.addEventListener('load', () => window.setTimeout(printFrame, 300), { once: true });
    // Chromium fires iframe load asynchronously; this fallback handles cached stylesheets.
    window.setTimeout(() => {
      if (frame.isConnected) printFrame();
    }, 700);
  };

  const selectCurrentPage = () => {
    setSelected((current) => {
      const next = { ...current };
      for (const variant of catalog?.data ?? []) {
        next[variant.id] = next[variant.id] ?? {
          variant,
          quantity: Math.max(0, Math.floor(variant.stock?.available || 0)),
        };
      }
      return next;
    });
  };

  return (
    <PageContainer title="Impresión de Etiquetas">
      <div className={styles.container}>
        <section className={`${styles.card} ${styles.noPrint}`}>
          <div className={styles.toolbar}>
            <div className={styles.searchSection}>
              <Search size={18} className={styles.searchIcon} />
              <input
                aria-label="Filtrar productos"
                placeholder="Buscar por producto, SKU o código de barras…"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.templateSelect}>
              <label htmlFor="label-template">Formato de etiqueta</label>
              <select id="label-template" value={activeTemplate?.id ?? ''} onChange={(event) => setTemplateId(event.target.value)}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name} ({template.labelWidth} × {template.labelHeight} mm)</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filtersRow}>
            <div className={styles.filterSelect}>
              <label htmlFor="label-category">Categoría</label>
              <select id="label-category" value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }}>
                <option value="">Todas las categorías</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </div>
            <div className={styles.filterSelect}>
              <label htmlFor="label-brand">Marca</label>
              <select id="label-brand" value={brandId} onChange={(event) => { setBrandId(event.target.value); setPage(1); }}>
                <option value="">Todas las marcas</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
              </select>
            </div>
            {(categoryId || brandId) && <Button variant="ghost" size="sm" onClick={() => { setCategoryId(''); setBrandId(''); setPage(1); }}>Limpiar filtros</Button>}
          </div>

          <div className={styles.selectionBar}>
            <div><strong>{Object.keys(selected).length}</strong> productos seleccionados <span>·</span> <strong>{totalLabels}</strong> etiquetas</div>
            <div className={styles.selectionActions}>
              <Button variant="ghost" size="sm" onClick={selectCurrentPage}>Seleccionar página</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected({})} disabled={!Object.keys(selected).length}>Limpiar</Button>
              <Button variant="primary" icon={<Printer size={16} />} onClick={printLabels} disabled={!printItems.length}>Imprimir {totalLabels} etiquetas</Button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr>
                <th className={styles.checkColumn}>Imprimir</th><th>Producto / variante</th><th>SKU</th><th className={styles.stockColumn}>Stock disponible</th><th className={styles.quantityColumn}>Etiquetas</th>
              </tr></thead>
              <tbody>
                {isLoading && <tr><td colSpan={5} className={styles.empty}>Cargando productos…</td></tr>}
                {!isLoading && catalog?.data.length === 0 && <tr><td colSpan={5} className={styles.empty}>No se encontraron productos.</td></tr>}
                {catalog?.data.map((variant) => {
                  const isSelected = Boolean(selected[variant.id]);
                  const available = Math.max(0, Math.floor(variant.stock?.available || 0));
                  return <tr key={variant.id} className={isSelected ? styles.selectedRow : undefined}>
                    <td className={styles.checkColumn}>
                      <input type="checkbox" aria-label={`Seleccionar ${variant.product.name} ${variant.sku}`} checked={isSelected} onChange={(event) => toggleVariant(variant, event.target.checked)} />
                    </td>
                    <td><div className={styles.itemName}>{variant.product.name}</div><div className={styles.itemAttributes}>{[variant.color, variant.size].filter(Boolean).join(' · ') || 'Sin atributos'}</div></td>
                    <td>{variant.sku}{variant.barcode && variant.barcode !== variant.sku ? <div className={styles.itemAttributes}>{variant.barcode}</div> : null}</td>
                    <td className={styles.stockColumn}><span className={available > 0 ? styles.stockAvailable : styles.stockEmpty}>{available}</span></td>
                    <td className={styles.quantityColumn}>
                      <input type="number" min="0" step="1" disabled={!isSelected} value={isSelected ? selected[variant.id].quantity : available} onChange={(event) => updateQuantity(variant, event.target.value)} aria-label={`Cantidad de etiquetas para ${variant.sku}`} />
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span>{catalog?.total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, catalog.total)} de ${catalog.total} variantes` : '0 variantes'}</span>
            <div>
              <Button variant="ghost" size="sm" icon={<ChevronLeft size={16} />} disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button>
              <span>Página {page} de {totalPages}</span>
              <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button>
            </div>
          </div>
        </section>

        {activeTemplate && <section ref={printAreaRef} className={styles.printArea}>
          {printItems.flatMap(({ variant, quantity }) => Array.from({ length: quantity }, (_, index) => (
            <LabelRenderer key={`${variant.id}-${index}`} data={toPrintData(variant, storeName, logoUrl)} layout={activeTemplate.layout} widthMm={activeTemplate.labelWidth} heightMm={activeTemplate.labelHeight} />
          )))}
        </section>}
      </div>
    </PageContainer>
  );
}
