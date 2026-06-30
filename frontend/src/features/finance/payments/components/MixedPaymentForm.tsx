import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { PaymentMethodType } from '@/types';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

export interface MixedPaymentLine {
  id: string;
  method: PaymentMethodType;
  amount: number;
  reference: string;
}

interface Props {
  targetAmount: number;
  onPay: (lines: Omit<MixedPaymentLine, 'id'>[]) => void;
  isLoading?: boolean;
}

export function MixedPaymentForm({ targetAmount, onPay, isLoading }: Props) {
  const [lines, setLines] = useState<MixedPaymentLine[]>([
    { id: '1', method: 'CASH', amount: targetAmount, reference: '' }
  ]);

  const totalAdded = lines.reduce((acc, l) => acc + l.amount, 0);
  const remaining = targetAmount - totalAdded;

  const addLine = () => {
    if (remaining <= 0) {
      toast.error('Ya has cubierto el total a pagar.');
      return;
    }
    setLines([...lines, { id: Math.random().toString(), method: 'CREDIT_CARD', amount: remaining, reference: '' }]);
  };

  const updateLine = (id: string, field: keyof MixedPaymentLine, value: any) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSubmit = () => {
    if (totalAdded !== targetAmount) {
      toast.error(`El monto de los pagos debe ser exactamente igual al total ($${targetAmount}). Diferencia: $${remaining}`);
      return;
    }
    onPay(lines.map(l => ({ method: l.method, amount: l.amount, reference: l.reference })));
  };



  return (
    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px' }}>Medios de Pago</h3>
        <Button variant="ghost" size="sm" onClick={addLine} icon={<Plus size={16} />}>Dividir Pago</Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {lines.map((l) => (
          <div key={l.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 2 }}>
              <select 
                value={l.method} 
                onChange={e => updateLine(l.id, 'method', e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '14px' }}
              >
                <option value="CASH">Efectivo</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="DEBIT_CARD">Tarjeta de Débito</option>
                <option value="BANK_TRANSFER">Transferencia</option>
                <option value="STORE_CREDIT">Crédito a Favor</option>
              </select>
            </div>
            
            <div style={{ flex: 2 }}>
              <Input 
                type="number" min="0" step="0.01" 
                value={l.amount} 
                onChange={e => updateLine(l.id, 'amount', Number(e.target.value))}
              />
            </div>

            {l.method !== 'CASH' && (
              <div style={{ flex: 2 }}>
                <Input 
                  placeholder="Referencia (Ej: L4T 1234)" 
                  value={l.reference} 
                  onChange={e => updateLine(l.id, 'reference', e.target.value)}
                />
              </div>
            )}

            <div style={{ paddingTop: '8px' }}>
              <Trash2 size={20} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(l.id)} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px', background: remaining === 0 ? 'var(--green-bg)' : 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Falta Pagar</p>
          <span style={{ fontSize: '18px', fontWeight: 800, color: remaining === 0 ? 'var(--green)' : 'var(--orange)' }}>
            {formatCurrency(remaining)}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Total Ingresado</p>
          <span style={{ fontSize: '20px', fontWeight: 900 }}>{formatCurrency(totalAdded)}</span>
        </div>
      </div>

      <Button 
        variant="primary" 
        style={{ width: '100%', marginTop: '16px', height: '48px', fontSize: '16px' }}
        onClick={handleSubmit}
        disabled={totalAdded !== targetAmount || isLoading}
        loading={isLoading}
      >
        Procesar Pago ({lines.length} métodos)
      </Button>

    </div>
  );
}
