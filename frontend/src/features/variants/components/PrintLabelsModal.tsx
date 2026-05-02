import { useState } from 'react';
import { Drawer, Button, Input } from '@/components/ui';
import { identifiersApi } from '@/api/identifiers.api';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Printer } from 'lucide-react';
import type { ProductVariant } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  variant: ProductVariant | null;
}

export function PrintLabelsModal({ open, onClose, variant }: Props) {
  const [quantity, setQuantity] = useState(1);

  const mutation = useMutation({
    mutationFn: () => identifiersApi.printLabels(variant!.id, quantity),
    onSuccess: (blob) => {
      // Create a blob URL and open it (e.g. PDF print dialog)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `labels_${variant?.sku}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Etiquetas generadas listas para imprimir.');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al generar etiquetas. Verificá que el código de barras sea válido.');
    }
  });

  if (!variant) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Impresión de Etiquetas"
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={() => mutation.mutate()} loading={mutation.isPending} icon={<Printer size={16} />}>
            Generar PDF ({quantity})
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Variante seleccionada:</p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>{variant.sku}</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Cód. de Barras: {variant.barcode || 'No posee'}</p>
        </div>

        {!variant.barcode && (
          <div style={{ padding: '12px', background: 'var(--yellow-bg)', color: 'var(--yellow)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
            Atención: Esta variante no tiene un código de barras (EAN/UPC) asignado. La etiqueta solo imprimirá el SKU y Precio.
          </div>
        )}

        <Input 
          label="Cantidad de Etiquetas a Imprimir" 
          type="number" 
          min="1" 
          max="500" 
          value={quantity} 
          onChange={(e) => setQuantity(Number(e.target.value))} 
        />
      </div>
    </Drawer>
  );
}
