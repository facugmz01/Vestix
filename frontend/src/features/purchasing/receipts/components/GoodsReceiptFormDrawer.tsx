import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input, Table } from '@/components/ui';
import { purchasesApi } from '@/api/purchases.api';
import { receiptsApi, type DraftReceiptDto } from '@/api/receipts.api';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import toast from 'react-hot-toast';
import { PackageCheck } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function GoodsReceiptFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [poSearchId, setPoSearchId] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);

  // local state for scanning items
  const [scannedItems, setScannedItems] = useState<Record<string, number>>({});

  const searchPO = async () => {
    if (!poSearchId.trim()) return;
    try {
      const data = await purchasesApi.getOrder(poSearchId.trim());
      if (data.status !== 'ISSUED' && data.status !== 'PARTIALLY_RECEIVED') {
        toast.error(`La Orden está en estado ${data.status} y no puede ser recibida.`);
        return;
      }
      setPurchaseOrder(data);
      // Pre-fill with 0
      const initial = data.lines.reduce((acc, line) => ({ ...acc, [line.variantId]: 0 }), {});
      setScannedItems(initial);
    } catch (err: any) {
      toast.error('OC no encontrada o error de conexión');
    }
  };

  useEffect(() => {
    if (!open) {
      setPoSearchId('');
      setPurchaseOrder(null);
      setScannedItems({});
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data: DraftReceiptDto) => receiptsApi.draftReceipt(data),
    onSuccess: (receipt) => {
      toast.success(receipt.status === 'DISPUTED' ? 'Borrador creado CON DIFERENCIAS' : 'Borrador creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al crear remito de entrada'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrder) return;

    const payloadLines = Object.entries(scannedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([variantId, qty]) => {
        return { 
          poLineItemId: variantId, 
          variantId, 
          quantity: qty 
        };
      });

    if (payloadLines.length === 0) {
      toast.error('Tenés que indicar al menos un artículo recibido mayor a 0');
      return;
    }

    mutation.mutate({
      purchaseOrderId: purchaseOrder.id,
      scannedItems: payloadLines,
    });
  };

  return (
    <Drawer
      open={open}
      title="Nuevo Remito de Entrada (Recepción)"
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending} disabled={!purchaseOrder}>
            Generar Borrador de Recepción
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {!purchaseOrder ? (
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Para iniciar una recepción, primero identificá la Orden de Compra.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="Ej: PO-1234..." value={poSearchId} onChange={e => setPoSearchId(e.target.value)} />
              </div>
              <Button onClick={searchPO}>Buscar OC</Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', background: 'var(--blue-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--blue)' }}>Recepcionando Orden de Compra</p>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'monospace' }}>{purchaseOrder.id}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>{purchaseOrder.supplierName || 'Proveedor Desconocido'}</p>
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <Button variant="secondary" size="sm" onClick={() => setPurchaseOrder(null)}>Cambiar OC</Button>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PackageCheck size={18} /> Conteo Físico (Bultos Recibidos)
              </h4>
              <Table
                keyField="variantId"
                data={purchaseOrder.lines}
                columns={[
                  { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
                  { 
                    key: 'expected', 
                    header: 'Faltan Ingresar', 
                    render: (l) => (
                      <span style={{ fontWeight: 'bold' }}>{Math.max(0, l.orderedQuantity - (l.receivedQuantity || 0))}</span>
                    ) 
                  },
                  { 
                    key: 'scanned', 
                    header: 'Cant. Escaneada', 
                    render: (l) => (
                      <input 
                        type="number" 
                        min="0"
                        value={scannedItems[l.variantId] ?? 0} 
                        onChange={e => setScannedItems({ ...scannedItems, [l.variantId]: Number(e.target.value) })}
                        style={{ width: '80px', padding: '6px', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 'bold', textAlign: 'right' }}
                      />
                    )
                  }
                ]}
              />
            </div>
          </>
        )}

      </div>
    </Drawer>
  );
}
