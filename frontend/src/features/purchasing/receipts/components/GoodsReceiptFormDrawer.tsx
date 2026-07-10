import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input, Table } from '@/components/ui';
import { purchasesApi } from '@/api/purchases.api';
import { receiptsApi, type DraftReceiptDto } from '@/api/receipts.api';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import toast from 'react-hot-toast';
import { PackageCheck } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';


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
  const [batchInfo, setBatchInfo] = useState<Record<string, { lot: string; expiration: string }>>({});

  const searchPO = async () => {
    if (!poSearchId.trim()) return;
    try {
      const data = await purchasesApi.getOrder(poSearchId.trim());
      if (data.status !== 'ISSUED' && data.status !== 'PARTIALLY_RECEIVED') {
        toast.error(`La Orden está en estado ${data.status} y no puede ser recibida.`);
        return;
      }
      setPurchaseOrder(data);
      const initial = data.lines.reduce((acc, line) => ({ ...acc, [line.id]: 0 }), {} as Record<string, number>);
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
      setBatchInfo({});
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
      .map(([poLineItemId, qty]) => {
        const line = purchaseOrder.lines.find((l) => l.id === poLineItemId);
        if (!line) return null;
        return {
          poLineItemId,
          variantId: line.variantId,
          quantity: qty,
          batchLot: batchInfo[poLineItemId]?.lot || undefined,
          batchExpirationDate: batchInfo[poLineItemId]?.expiration || undefined,
        };
      })
      .filter(Boolean) as DraftReceiptDto['scannedItems'];

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
      <div className={styles.formStackMd}>
        
        {!purchaseOrder ? (
          <div className={styles.sectionPanel}>
            <p className={styles.introText}>Para iniciar una recepción, primero identificá la Orden de Compra.</p>
            <div className={styles.searchRow}>
              <div className={styles.flex1}>
                <Input placeholder="Ej: PO-1234..." value={poSearchId} onChange={e => setPoSearchId(e.target.value)} />
              </div>
              <Button onClick={searchPO}>Buscar OC</Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.receiptHeroBlue}>
              <p className={styles.receiptHeroBlueLabel}>Recepcionando Orden de Compra</p>
              <h3 className={styles.heroTitleAccent}>{purchaseOrder.id}</h3>
              <p className={styles.customerName}>{purchaseOrder.supplierName || 'Proveedor Desconocido'}</p>
              <div className={styles.receiptHeroAction}>
                <Button variant="secondary" size="sm" onClick={() => setPurchaseOrder(null)}>Cambiar OC</Button>
              </div>
            </div>

            <div>
              <h4 className={styles.sectionTitleRow}>
                <PackageCheck size={18} /> Conteo Físico (Bultos Recibidos)
              </h4>
              <Table
                keyField="id"
                data={purchaseOrder.lines}
                columns={[
                  { key: 'sku', header: 'SKU', render: (l) => <span className={styles.monoBold}>{l.variantSku || l.variantId}</span> },
                  { 
                    key: 'expected', 
                    header: 'Faltan Ingresar', 
                    render: (l) => (
                      <span className={styles.textBold}>{Math.max(0, l.orderedQuantity - (l.receivedQuantity || 0))}</span>
                    ) 
                  },
                  { 
                    key: 'scanned', 
                    header: 'Cant. Escaneada', 
                    render: (l) => (
                      <input 
                        type="number" 
                        min="0"
                        value={scannedItems[l.id] ?? 0} 
                        onChange={e => setScannedItems({ ...scannedItems, [l.id]: Number(e.target.value) })}
                        className={styles.qtyInputMd}
                      />
                    )
                  },
                  {
                    key: 'batch',
                    header: 'Lote / Vencimiento (Opcional)',
                    render: (l) => (
                      <div className={styles.inlineInputRow}>
                        <input
                          type="text"
                          placeholder="Nro Lote"
                          value={batchInfo[l.id]?.lot || ''}
                          onChange={e => setBatchInfo({ ...batchInfo, [l.id]: { ...batchInfo[l.id], lot: e.target.value } })}
                          className={styles.inputMd}
                        />
                        <input
                          type="date"
                          value={batchInfo[l.id]?.expiration || ''}
                          onChange={e => setBatchInfo({ ...batchInfo, [l.id]: { ...batchInfo[l.id], expiration: e.target.value } })}
                          className={styles.inputLg}
                        />
                      </div>
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
