import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { labelsApi } from '@/api/labels.api';
import { settingsApi } from '@/api/settings.api';
import toast from 'react-hot-toast';
import { Printer, FileDown, Tag } from 'lucide-react';

export interface LabelPrintItem {
  variantId: string;
  sku?: string;
  productName?: string;
  quantity: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: LabelPrintItem[];
  title?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function BulkPrintLabelsModal({ open, onClose, items, title = 'Impresión de etiquetas' }: Props) {
  const [templateId, setTemplateId] = useState('');
  const [defaultQty, setDefaultQty] = useState(1);

  const { data: templates = [] } = useQuery({
    queryKey: ['labelTemplates'],
    queryFn: () => labelsApi.getTemplates(),
    enabled: open,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const defaultTpl =
      settings?.labelPrinting?.defaultTemplateId ||
      templates.find((t) => t.isDefault)?.id ||
      templates[0]?.id ||
      '';
    setTemplateId(defaultTpl);
  }, [open, settings, templates]);

  const effectiveItems = items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity > 0 ? item.quantity : defaultQty,
  }));

  const totalLabels = effectiveItems.reduce((sum, i) => sum + i.quantity, 0);

  const pdfMutation = useMutation({
    mutationFn: () => labelsApi.printBulk(effectiveItems, templateId || undefined),
    onSuccess: (blob) => {
      downloadBlob(blob, 'labels.pdf');
      toast.success('PDF generado');
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al generar PDF'),
  });

  const zplMutation = useMutation({
    mutationFn: () => labelsApi.exportZpl(effectiveItems, templateId || undefined),
    onSuccess: (blob) => {
      downloadBlob(blob, 'labels.zpl');
      toast.success('Archivo ZPL generado para impresora Zebra');
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al generar ZPL'),
  });

  if (!open || items.length === 0) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pdfMutation.isPending || zplMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="ghost"
            icon={<FileDown size={16} />}
            onClick={() => zplMutation.mutate()}
            loading={zplMutation.isPending}
          >
            ZPL ({totalLabels})
          </Button>
          <Button
            variant="primary"
            icon={<Printer size={16} />}
            onClick={() => pdfMutation.mutate()}
            loading={pdfMutation.isPending}
          >
            PDF ({totalLabels})
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {items.length} variante{items.length !== 1 ? 's' : ''} · {totalLabels} etiqueta{totalLabels !== 1 ? 's' : ''} en total
          </p>
        </div>

        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            <Tag size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Plantilla
          </label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.labelWidth}×{t.labelHeight} mm)
              </option>
            ))}
          </select>
        </div>

        {items.every((i) => i.quantity <= 0) && (
          <Input
            label="Cantidad por variante"
            type="number"
            min={1}
            max={500}
            value={defaultQty}
            onChange={(e) => setDefaultQty(Number(e.target.value))}
          />
        )}

        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', maxHeight: 160, overflowY: 'auto' }}>
          {items.map((item) => (
            <li key={item.variantId}>
              <span style={{ fontFamily: 'monospace' }}>{item.sku || item.variantId.slice(0, 8)}</span>
              {item.productName && ` — ${item.productName}`}
              {' '}× {item.quantity > 0 ? item.quantity : defaultQty}
            </li>
          ))}
        </ul>

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          ZPL es compatible con impresoras Zebra (GK420d, ZD220, etc.). Enviá el archivo al puerto 9100 de la impresora o usá Zebra Setup Utilities.
        </p>
      </div>
    </Drawer>
  );
}
