import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export function TreasuryTransactionModal({ open, onClose, shiftId }: Props) {
  const queryClient = useQueryClient();

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [concept, setConcept] = useState('');

  const mutation = useMutation({
    mutationFn: () => treasuryApi.addManualMovement(shiftId!, { type, amount, concept }),
    onSuccess: () => {
      toast.success(type === 'INCOME' ? 'Ingreso registrado' : 'Retiro / Gasto registrado');
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.shiftDetail(shiftId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.shiftMovements(shiftId!) });
      onClose();
      setAmount(0);
      setConcept('');
    },
    onError: (err: any) => toast.error(err.message || 'Error al procesar la transacción'),
  });

  const handleSubmit = () => {
    if (amount <= 0) { toast.error('El monto debe ser mayor a 0'); return; }
    if (!concept.trim()) { toast.error('Debe ingresar un concepto'); return; }
    mutation.mutate();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Nuevo Movimiento Manual" width="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600 }}>Tipo de Movimiento</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Button variant={type === 'EXPENSE' ? 'primary' : 'outline'} onClick={() => setType('EXPENSE')} icon={<ArrowUpRight size={18} color={type === 'EXPENSE' ? 'var(--bg-base)' : 'var(--red)'} />}>
              Retiro / Gasto
            </Button>
            <Button variant={type === 'INCOME' ? 'primary' : 'outline'} onClick={() => setType('INCOME')} icon={<ArrowDownRight size={18} color={type === 'INCOME' ? 'var(--bg-base)' : 'var(--green)'} />}>
              Ingreso Extra
            </Button>
          </div>
        </div>

        <Input 
          label="Monto ($)" 
          type="number" 
          min="0" 
          step="0.01" 
          value={amount} 
          onChange={e => setAmount(Number(e.target.value))} 
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Concepto / Justificación</label>
          <textarea 
            value={concept} 
            onChange={e => setConcept(e.target.value)} 
            rows={3} 
            placeholder="Ej: Pago a proveedor de limpieza, Flete, etc."
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} 
          />
        </div>

        <Button 
          variant="primary" 
          onClick={handleSubmit} 
          loading={mutation.isPending} 
          style={{ marginTop: '12px', height: '48px' }}
        >
          Guardar Movimiento
        </Button>

      </div>
    </Drawer>
  );
}
