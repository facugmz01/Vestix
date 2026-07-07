import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';

import { Button, Input } from '@/components/ui';
import { labelsApi } from '@/api/labels.api';
import { settingsApi } from '@/api/settings.api';
import { priceListsApi } from '@/api/priceLists.api';
import { productsApi } from '@/api/products.api';
import type { LabelTemplate, LabelElement, LabelLayout, LabelPrintData } from '../../types/label.types';
import { createDefaultLayout, newElementId } from '../../types/label.types';
import { ElementPalette, type PaletteItem } from './ElementPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { TemplateCanvas } from './TemplateCanvas';
import styles from './TemplateEditor.module.css';

interface Props {
  template?: LabelTemplate | null;
}

const FALLBACK_PREVIEW: LabelPrintData = {
  storeName: 'Mi Tienda',
  productName: 'Remera Básica',
  sku: 'REM-BLK-M',
  barcode: '0401234567890',
  size: 'M',
  color: 'Negro',
  price: 15999,
};

export function TemplateEditor({ template }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!template;

  const [name, setName] = useState(template?.name ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [labelWidth, setLabelWidth] = useState(template?.labelWidth ?? 38);
  const [labelHeight, setLabelHeight] = useState(template?.labelHeight ?? 25);
  const [paperType, setPaperType] = useState<'ROLL' | 'SHEET'>(template?.paperType ?? 'ROLL');
  const [layout, setLayout] = useState<LabelLayout>(
    template?.layout ?? createDefaultLayout(38, 25),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [variantSearch, setVariantSearch] = useState('');
  const [previewVariantId, setPreviewVariantId] = useState<string | null>(null);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const { data: priceListsData } = useQuery({
    queryKey: ['priceLists', { pageSize: 100 }],
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100, isActive: true }),
  });

  const { data: variantResults } = useQuery({
    queryKey: ['variants-search-editor', variantSearch],
    queryFn: () => productsApi.getVariants(variantSearch),
    enabled: variantSearch.length > 2,
  });

  const priceLists = (priceListsData?.data ?? []).map((pl) => ({ id: pl.id, name: pl.name }));

  const previewData = useMemo((): LabelPrintData => {
    const base = { ...FALLBACK_PREVIEW };
    if (settings?.general?.companyName) base.storeName = settings.general.companyName;
    if (settings?.general?.logoUrl) base.logoUrl = settings.general.logoUrl;

    const selected = variantResults?.find((v) => v.id === previewVariantId);
    if (selected) {
      base.productName = selected.product?.name ?? base.productName;
      base.sku = selected.sku;
      base.barcode = selected.barcode || selected.sku;
      base.size = selected.size ?? undefined;
      base.color = selected.color ?? undefined;
      base.price = selected.basePrice ?? 0;
    }
    return base;
  }, [settings, variantResults, previewVariantId]);

  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setDescription(template.description ?? '');
    setLabelWidth(template.labelWidth);
    setLabelHeight(template.labelHeight);
    setPaperType(template.paperType);
    setLayout(template.layout);
  }, [template]);

  const selectedElement = layout.elements.find((e) => e.id === selectedId) ?? null;

  const handleAddElement = (item: PaletteItem) => {
    const newEl: LabelElement = {
      id: newElementId(),
      type: item.type,
      field: item.field,
      x: 2,
      y: 2,
      width: item.type === 'TEXT' ? labelWidth - 4 : labelWidth - 4,
      height: item.type === 'TEXT' ? 4 : 8,
      fontSize: item.type === 'TEXT' ? 8 : undefined,
      fontWeight: item.field === 'storeName' || item.field === 'productName' ? 'bold' : 'normal',
      textAlign: 'center',
      visible: true,
      customText: item.field === 'custom' ? 'Texto' : undefined,
    };
    setLayout((prev) => ({ ...prev, elements: [...prev.elements, newEl] }));
    setSelectedId(newEl.id);
  };

  const handleElementChange = (element: LabelElement) => {
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.map((e) => (e.id === element.id ? element : e)),
    }));
  };

  const handleDeleteElement = () => {
    if (!selectedId) return;
    setLayout((prev) => ({
      ...prev,
      elements: prev.elements.filter((e) => e.id !== selectedId),
    }));
    setSelectedId(null);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description: description || undefined,
        labelWidth,
        labelHeight,
        paperType,
        layout,
        isDefault: template?.isDefault,
      };
      return isEdit
        ? labelsApi.updateTemplate(template!.id, payload)
        : labelsApi.createTemplate(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Plantilla guardada' : 'Plantilla creada');
      queryClient.invalidateQueries({ queryKey: ['labelTemplates'] });
      navigate('/admin/label-templates');
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al guardar'),
  });

  return (
    <div className={styles.templateEditor}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/label-templates')}>
            Volver
          </Button>
          <h1 className={styles.toolbarTitle}>{isEdit ? `Editar: ${template?.name}` : 'Nueva plantilla'}</h1>
        </div>
        <div className={styles.previewBar}>
          <Button
            variant="ghost"
            size="sm"
            icon={showLivePreview ? <EyeOff size={14} /> : <Eye size={14} />}
            onClick={() => setShowLivePreview(!showLivePreview)}
          >
            {showLivePreview ? 'Modo edición' : 'Vista previa real'}
          </Button>
          <Button variant="primary" icon={<Save size={16} />} loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Guardar
          </Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input label="Ancho (mm)" type="number" value={labelWidth} onChange={(e) => setLabelWidth(Number(e.target.value))} />
        <Input label="Alto (mm)" type="number" value={labelHeight} onChange={(e) => setLabelHeight(Number(e.target.value))} />
      </div>

      <div className={styles.previewBar} style={{ marginBottom: 12 }}>
        <Input
          label="Variante de ejemplo (buscar SKU)"
          placeholder="Mín. 3 caracteres..."
          value={variantSearch}
          onChange={(e) => setVariantSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        {variantResults && variantResults.length > 0 && (
          <select
            className={styles.select}
            style={{ maxWidth: 280, alignSelf: 'flex-end' }}
            value={previewVariantId ?? ''}
            onChange={(e) => setPreviewVariantId(e.target.value || null)}
          >
            <option value="">Datos de ejemplo</option>
            {variantResults.map((v) => (
              <option key={v.id} value={v.id}>
                {v.sku} — {v.product?.name}
              </option>
            ))}
          </select>
        )}
        <div style={{ alignSelf: 'flex-end' }}>
          <label className={styles.label}>Tipo papel</label>
          <select className={styles.select} value={paperType} onChange={(e) => setPaperType(e.target.value as 'ROLL' | 'SHEET')}>
            <option value="ROLL">Rollo</option>
            <option value="SHEET">Hoja</option>
          </select>
        </div>
      </div>

      <div className={styles.workspace}>
        <ElementPalette onAdd={handleAddElement} />

        <TemplateCanvas
          layout={layout}
          widthMm={labelWidth}
          heightMm={labelHeight}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onLayoutChange={setLayout}
          previewData={previewData}
          showLivePreview={showLivePreview}
        />

        <PropertiesPanel
          element={selectedElement}
          onChange={handleElementChange}
          onDelete={handleDeleteElement}
          barcodeSymbology={layout.barcodeSymbology}
          onBarcodeSymbologyChange={(v) => setLayout((prev) => ({ ...prev, barcodeSymbology: v }))}
          priceSource={layout.priceSource}
          onPriceSourceChange={(v) => setLayout((prev) => ({ ...prev, priceSource: v }))}
          priceListId={layout.priceListId}
          onPriceListIdChange={(v) => setLayout((prev) => ({ ...prev, priceListId: v || undefined }))}
          priceLists={priceLists}
        />
      </div>
    </div>
  );
}
