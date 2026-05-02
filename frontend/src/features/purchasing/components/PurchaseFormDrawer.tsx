import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { purchasesApi, type CreatePurchaseOrderDto } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import toast from 'react-hot-toast';
import { Plus, X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  orderToEdit?: PurchaseOrder | null;
}

export function PurchaseFormDrawer({ open, onClose, orderToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!orderToEdit;

  const [supplierId, setSupplierId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [lines, setLines] = useState<{ variantId: string; variantSku: string; quantity: number; unitCost: number }[]>([]);

  const [variantSearch, setVariantSearch] = useState('');
  const [variantQty, setVariantQty] = useState(1);
  const [variantCost, setVariantCost] = useState(0);

  const { data: suppliersData } = useQuery({ 
    queryKey: queryKeys.suppliers.all(), 
    queryFn: () => suppliersApi.getSuppliers({}),
    enabled: open
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get('/warehouses').then(res => res.data),
    enabled: open
  });

  useEffect(() => {
    if (open && orderToEdit) {
      setSupplierId(orderToEdit.supplierId);
      setDestinationWarehouseId(orderToEdit.destinationWarehouseId || '');
      setExpectedDeliveryDate(orderToEdit.expectedDeliveryDate ? orderToEdit.expectedDeliveryDate.split('T')[0] : '');
      setLines(orderToEdit.lines.map(l => ({
        variantId: l.variantId,
        variantSku: l.variantSku || l.variantId,
        quantity: l.orderedQuantity,
        unitCost: l.unitCost
      })));
    } else if (open && !orderToEdit) {
      setSupplierId('');
      setDestinationWarehouseId('');
      setExpectedDeliveryDate('');
      setLines([]);
    }
  }, [open, orderToEdit]);

  const addLine = () => {
    if (!variantSearch.trim() || variantQty <= 0 || variantCost < 0) return;
    setLines([...lines, { variantId: variantSearch, variantSku: variantSearch, quantity: variantQty, unitCost: variantCost }]);
    setVariantSearch('');
    setVariantQty(1);
    setVariantCost(0);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const totals = lines.reduce((acc, line) => acc + (line.quantity * line.unitCost), 0);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, expectedDeliveryDate: data.expectedDeliveryDate || undefined };
      if (isEditing && orderToEdit) return purchasesApi.updateOrder(orderToEdit.id, payload);
      return purchasesApi.createOrder(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Orden actualizada (Borrador)' : 'Orden de compra creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      if (isEditing) queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(orderToEdit!.id) });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al guardar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return toast.error('Seleccioná un proveedor');
    if (!destinationWarehouseId) return toast.error('Seleccioná un depósito de destino');
    if (lines.length === 0) return toast.error('Agregá al menos un artículo a la orden');
    
    mutation.mutate({
      supplierId,
      destinationWarehouseId,
      expectedDeliveryDate,
      lines: lines.map(l => ({ variantId: l.variantId, orderedQuantity: l.quantity, unitCost: l.unitCost })),
    });
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Guardar Borrador</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Proveedor *</label>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} required>
              <option value="">Seleccionar Proveedor...</option>
              {(suppliersData?.data || []).map((s: any) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Destino (Depósito) *</label>
            <select value={destinationWarehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} required>
              <option value="">Seleccionar Depósito...</option>
              {(warehouses?.data || warehouses || []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          
          <Input 
            label="Fecha de Entrega Esperada" 
            type="date" 
            value={expectedDeliveryDate} 
            onChange={e => setExpectedDeliveryDate(e.target.value)} 
          />
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>Artículos (Detalle de OC)</h4>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}><Input label="SKU" value={variantSearch} onChange={e => setVariantSearch(e.target.value)} /></div>
            <div style={{ flex: 1 }}><Input label="Cant." type="number" min="1" value={variantQty} onChange={e => setVariantQty(Number(e.target.value))} /></div>
            <div style={{ flex: 1 }}><Input label="Costo U. ($)" type="number" min="0" step="0.01" value={variantCost} onChange={e => setVariantCost(Number(e.target.value))} /></div>
            <Button type="button" variant="outline" onClick={addLine} style={{ marginBottom: '2px' }}><Plus size={16} /></Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lines.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No hay artículos en la OC.</p>}
            {lines.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '4px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>{l.variantSku}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px' }}>Cant: {l.quantity}</span>
                  <span style={{ fontSize: '13px' }}>Costo: ${l.unitCost}</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>${l.quantity * l.unitCost}</span>
                  <X size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(i)} />
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)', textAlign: 'right' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Monto Total OC: </span>
            <span style={{ fontSize: '20px', fontWeight: 900 }}>${totals.toFixed(2)}</span>
          </div>
        </div>

      </form>
    </Drawer>
  );
}
