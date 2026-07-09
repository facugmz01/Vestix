import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { transfersApi, type CreateTransferDto } from '@/api/transfers.api';
import { warehousesApi } from '@/api/warehouses.api';

import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TransferFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [lines, setLines] = useState<{ variantId: string; variantSku: string; quantity: number }[]>([]);

  const { data: warehousesData } = useQuery({ 
    queryKey: queryKeys.warehouses.all(), 
    queryFn: () => warehousesApi.getWarehouses({}),
    enabled: open
  });

  const [variantSearch, setVariantSearch] = useState('');
  const [variantQty, setVariantQty] = useState(1);

  const addLine = () => {
    if (!variantSearch.trim()) return;
    if (variantQty <= 0) return;
    setLines([...lines, { variantId: variantSearch, variantSku: variantSearch, quantity: variantQty }]);
    setVariantSearch('');
    setVariantQty(1);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: (data: CreateTransferDto) => transfersApi.createTransfer(data),
    onSuccess: () => {
      toast.success('Transferencia creada en estado BORRADOR');
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all() });
      onClose();
      setSourceWarehouseId('');
      setDestinationWarehouseId('');
      setLines([]);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al crear la transferencia');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceWarehouseId || !destinationWarehouseId) {
      toast.error('Seleccioná depósito de origen y destino');
      return;
    }
    if (sourceWarehouseId === destinationWarehouseId) {
      toast.error('El origen y destino no pueden ser el mismo depósito');
      return;
    }
    if (lines.length === 0) {
      toast.error('Agregá al menos un artículo a transferir');
      return;
    }

    mutation.mutate({
      sourceWarehouseId,
      destinationWarehouseId,
      lines: lines.map(l => ({ variantId: l.variantId, quantity: l.quantity })),
    });
  };

  return (
    <Drawer
      open={open}
      title="Nueva Transferencia (Borrador)"
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Crear Solicitud</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formStackMd}>
        <div className="grid-responsive grid-cols-2">
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Depósito de Origen (Sale)</label>
            <select value={sourceWarehouseId} onChange={e => setSourceWarehouseId(e.target.value)} className={styles.select} required>
              <option value="">Seleccionar Origen...</option>
              {warehousesData?.data.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Depósito de Destino (Entra)</label>
            <select value={destinationWarehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} className={styles.select} required>
              <option value="">Seleccionar Destino...</option>
              {warehousesData?.data.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.sectionPanel}>
          <h4 className={styles.sectionPanelTitle}>Artículos a Transferir</h4>
          
          <div className={styles.addLineRow}>
            <div className={styles.flex1}>
              <Input placeholder="Buscar SKU o Variante ID..." value={variantSearch} onChange={e => setVariantSearch(e.target.value)} />
            </div>
            <div className={styles.inputNarrow}>
              <Input type="number" min="1" value={variantQty} onChange={e => setVariantQty(Number(e.target.value))} />
            </div>
            <Button type="button" variant="ghost" onClick={addLine}><Plus size={16} /></Button>
          </div>

          <div className={styles.lineItemsStack}>
            {lines.length === 0 && <p className={styles.emptyLineHint}>No hay artículos en la lista.</p>}
            {lines.map((l, i) => (
              <div key={i} className={styles.lineItemRow}>
                <div>
                  <span className={styles.lineItemSku}>{l.variantSku}</span>
                </div>
                <div className={styles.lineItemActions}>
                  <span className={styles.lineItemQty}>Cant: {l.quantity}</span>
                  <X size={16} color="var(--red)" className={styles.clickable} onClick={() => removeLine(i)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Drawer>
  );
}
