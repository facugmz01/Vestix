import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Drawer, Button, Input, ToggleSwitch } from '@/components/ui';
import { labelsApi } from '@/api/labels.api';
import type { LabelTemplate, BarcodeSymbology } from '../types/label.types';
import { LabelRenderer } from './LabelRenderer';

interface Props {
  open: boolean;
  onClose: () => void;
  template?: LabelTemplate | null;
}

const SAMPLE_DATA = {
  storeName: 'Mi Tienda',
  productName: 'Remera Básica',
  sku: 'REM-BLK-M',
  barcode: '0401234567890',
  size: 'M',
  color: 'Negro',
  price: 15999,
};

export function TemplateFormDrawer({ open, onClose, template }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!template;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [labelWidth, setLabelWidth] = useState(38);
  const [labelHeight, setLabelHeight] = useState(25);
  const [paperType, setPaperType] = useState<'ROLL' | 'SHEET'>('ROLL');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showSizeColor, setShowSizeColor] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [barcodeSymbology, setBarcodeSymbology] = useState<BarcodeSymbology>('EAN13');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (!template) {
      setName('');
      setDescription('');
      setLabelWidth(38);
      setLabelHeight(25);
      setPaperType('ROLL');
      setShowStoreName(true);
      setShowProductName(true);
      setShowSizeColor(true);
      setShowBarcode(true);
      setShowPrice(true);
      setBarcodeSymbology('EAN13');
      setIsDefault(false);
      return;
    }

    setName(template.name);
    setDescription(template.description || '');
    setLabelWidth(template.labelWidth);
    setLabelHeight(template.labelHeight);
    setPaperType(template.paperType);
    setIsDefault(template.isDefault);
    setBarcodeSymbology(template.layout?.barcodeSymbology ?? 'EAN13');

    const fields = new Set(template.layout?.elements?.map((e) => e.field) ?? []);
    setShowStoreName(fields.has('storeName'));
    setShowProductName(fields.has('productName'));
    setShowSizeColor(fields.has('sizeColor'));
    setShowBarcode(template.layout?.elements?.some((e) => e.type === 'BARCODE' || e.type === 'QR') ?? true);
    setShowPrice(fields.has('price'));
  }, [template, open]);

  const previewLayout = {
    version: 1 as const,
    barcodeSymbology,
    barcodeSource: 'PRIMARY' as const,
    priceSource: 'BASE' as const,
    elements: [
      ...(showStoreName ? [{ id: 'store', type: 'TEXT' as const, field: 'storeName' as const, x: 1, y: 1, width: labelWidth - 2, fontSize: 6, fontWeight: 'bold' as const, textAlign: 'center' as const, visible: true }] : []),
      ...(showProductName ? [{ id: 'product', type: 'TEXT' as const, field: 'productName' as const, x: 1, y: 4, width: labelWidth - 2, fontSize: 8, fontWeight: 'bold' as const, textAlign: 'center' as const, visible: true }] : []),
      ...(showSizeColor ? [{ id: 'attrs', type: 'TEXT' as const, field: 'sizeColor' as const, x: 1, y: 8, width: labelWidth - 2, fontSize: 6, textAlign: 'center' as const, visible: true }] : []),
      ...(showBarcode ? [{ id: 'barcode', type: 'BARCODE' as const, field: 'barcode' as const, x: 2, y: 11, width: labelWidth - 4, height: 8, visible: true }] : []),
      ...(showPrice ? [{ id: 'price', type: 'TEXT' as const, field: 'price' as const, x: 1, y: labelHeight - 4, width: labelWidth - 2, fontSize: 9, fontWeight: 'bold' as const, textAlign: 'center' as const, visible: true }] : []),
    ],
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description: description || undefined,
        labelWidth,
        labelHeight,
        paperType,
        isDefault,
        showStoreName,
        showProductName,
        showSizeColor,
        showBarcode,
        showPrice,
        barcodeSymbology,
      };
      return isEdit
        ? labelsApi.updateTemplate(template!.id, payload)
        : labelsApi.createTemplate(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Plantilla actualizada' : 'Plantilla creada');
      queryClient.invalidateQueries({ queryKey: ['labelTemplates'] });
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al guardar'),
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar plantilla' : 'Nueva plantilla'}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Ancho (mm)" type="number" min={10} value={labelWidth} onChange={(e) => setLabelWidth(Number(e.target.value))} />
          <Input label="Alto (mm)" type="number" min={10} value={labelHeight} onChange={(e) => setLabelHeight(Number(e.target.value))} />
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tipo de papel</label>
          <select
            value={paperType}
            onChange={(e) => setPaperType(e.target.value as 'ROLL' | 'SHEET')}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            <option value="ROLL">Rollo continuo</option>
            <option value="SHEET">Hoja (Avery)</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Código de barras</label>
          <select
            value={barcodeSymbology}
            onChange={(e) => setBarcodeSymbology(e.target.value as BarcodeSymbology)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            <option value="EAN13">EAN-13</option>
            <option value="CODE128">CODE-128</option>
            <option value="QR">QR</option>
            <option value="NONE">Sin código</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Campos visibles</span>
          <ToggleSwitch label="Nombre de tienda" checked={showStoreName} onChange={(e) => setShowStoreName(e.target.checked)} />
          <ToggleSwitch label="Nombre de producto" checked={showProductName} onChange={(e) => setShowProductName(e.target.checked)} />
          <ToggleSwitch label="Talle y color" checked={showSizeColor} onChange={(e) => setShowSizeColor(e.target.checked)} />
          <ToggleSwitch label="Código de barras" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} />
          <ToggleSwitch label="Precio" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} />
          {!template?.isSystem && (
            <ToggleSwitch label="Plantilla por defecto" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          )}
        </div>

        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Vista previa</span>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <LabelRenderer
              data={SAMPLE_DATA}
              layout={previewLayout}
              widthMm={labelWidth}
              heightMm={labelHeight}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
