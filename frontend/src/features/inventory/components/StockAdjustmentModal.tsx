import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { inventoryApi, type AdjustStockDto, type EnrichedStockLevel } from '@/api/inventory.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { ArrowRightLeft } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  stockNode: EnrichedStockLevel | null;
}

export function StockAdjustmentModal({ open, onClose, stockNode }: Props) {
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState<number>(0);
  const [type, setType] = useState<AdjustStockDto['type']>('ADD');
  const [reason, setReason] = useState<string>('');

  const mutation = useMutation({
    mutationFn: (data: AdjustStockDto) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      toast.success('Ajuste de inventario aplicado con éxito');
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.movements() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] }); // General invalidate for safety if not using exact keys
      onClose();
      // Reset
      setQuantity(0);
      setType('ADD');
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al aplicar el ajuste de stock');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockNode) return;
    if (quantity <= 0 && type !== 'SET') {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    if (type === 'SUBTRACT' && quantity > stockNode.availableQuantity) {
      toast.error('No podés restar más cantidad de la que hay disponible');
      return;
    }
    if (!reason.trim()) {
      toast.error('El motivo del ajuste es obligatorio para la auditoría');
      return;
    }

    mutation.mutate({
      variantId: stockNode.variantId,
      warehouseId: stockNode.warehouseId,
      quantity,
      type,
      reason,
    });
  };

  if (!stockNode) return null;

  // Calculamos el resultado proyectado
  let projected = stockNode.availableQuantity;
  if (type === 'ADD') projected += quantity;
  if (type === 'SUBTRACT') projected -= quantity;
  if (type === 'SET') projected = quantity;

  return (
    <Drawer
      open={open}
      title="Ajuste Manual de Stock"
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Aplicar Ajuste</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-secondary)' }}>Variante afectada:</p>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{stockNode.productName}</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SKU: {stockNode.variantSku}</p>
          
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px' }}>Ubicación:</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{stockNode.warehouseName} ({stockNode.branchName})</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Tipo de Operación</label>
          <select value={type} onChange={e => setType(e.target.value as any)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <option value="ADD">Entrada (+ Sumar al stock)</option>
            <option value="SUBTRACT">Salida (- Restar al stock)</option>
            <option value="SET">Inventario Físico (= Reemplazar stock)</option>
          </select>
        </div>

        <Input 
          label="Cantidad a Ajustar" 
          type="number" 
          min={type === 'SET' ? "0" : "1"} 
          value={quantity} 
          onChange={e => setQuantity(Number(e.target.value))} 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Motivo de Auditoría *</label>
          <textarea 
            value={reason} 
            onChange={e => setReason(e.target.value)} 
            placeholder="Ej: Mercadería dañada, Ajuste cíclico, Sobrante..."
            rows={3}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', resize: 'vertical' }}
          />
        </div>

        {/* Proyección */}
        <div style={{ padding: '16px', background: 'var(--blue-bg)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Stock Actual</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{stockNode.availableQuantity}</p>
          </div>
          <ArrowRightLeft size={20} color="var(--text-muted)" />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--blue)' }}>Proyección (Disponible)</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'var(--blue)' }}>{projected}</p>
          </div>
        </div>

      </form>
    </Drawer>
  );
}
