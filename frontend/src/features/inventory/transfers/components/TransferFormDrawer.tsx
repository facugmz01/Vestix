import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { transfersApi, type CreateTransferDto } from '@/api/transfers.api';
import { warehousesApi } from '@/api/warehouses.api';
import { productsApi } from '@/api/products.api'; // Assuming we can search variants via products or similar. For UI simplicity, we'll mock variant selection or use a basic input
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TransferFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [lines, setLines] = useState<{ variantId: string; variantSku: string; quantity: number }[]>([]);

  // We need warehouses
  const { data: warehousesData } = useQuery({ 
    queryKey: queryKeys.warehouses.all(), 
    queryFn: () => warehousesApi.getWarehouses({}),
    enabled: open
  });

  // Mock variant search state
  const [variantSearch, setVariantSearch] = useState('');
  const [variantQty, setVariantQty] = useState(1);

  const addLine = () => {
    if (!variantSearch.trim()) return;
    if (variantQty <= 0) return;
    // Real implementation would select from a dropdown. Here we simulate typing a SKU/ID.
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
      // Reset
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
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Depósito de Origen (Sale)</label>
            <select value={sourceWarehouseId} onChange={e => setSourceWarehouseId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} required>
              <option value="">Seleccionar Origen...</option>
              {warehousesData?.data.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Depósito de Destino (Entra)</label>
            <select value={destinationWarehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} required>
              <option value="">Seleccionar Destino...</option>
              {warehousesData?.data.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Artículos a Transferir</h4>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <Input placeholder="Buscar SKU o Variante ID..." value={variantSearch} onChange={e => setVariantSearch(e.target.value)} />
            </div>
            <div style={{ width: '100px' }}>
              <Input type="number" min="1" value={variantQty} onChange={e => setVariantQty(Number(e.target.value))} />
            </div>
            <Button type="button" variant="ghost" onClick={addLine}><Plus size={16} /></Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lines.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No hay artículos en la lista.</p>}
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>{l.variantSku}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Cant: {l.quantity}</span>
                  <X size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(i)} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </form>
    </Drawer>
  );
}
