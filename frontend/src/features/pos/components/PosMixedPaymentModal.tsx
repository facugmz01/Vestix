import { useState } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import type { PaymentMethodType } from '@/types';

export interface PosPaymentSplit {
  id: string;
  method: PaymentMethodType;
  amount: number;
  reference: string;
}

interface Props {
  open: boolean;
  grandTotal: number;
  onClose: () => void;
  onConfirm: (splits: { method: string; amount: number; reference?: string }[]) => void;
  isLoading?: boolean;
}

const METHOD_OPTIONS: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CREDIT_CARD', label: 'Tarjeta de Crédito' },
  { value: 'DEBIT_CARD', label: 'Tarjeta de Débito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia' },
  { value: 'STORE_CREDIT', label: 'Cuenta Corriente' },
];

export function PosMixedPaymentModal({ open, grandTotal, onClose, onConfirm, isLoading }: Props) {
  const [lines, setLines] = useState<PosPaymentSplit[]>([
    { id: '1', method: 'CASH', amount: grandTotal, reference: '' },
  ]);

  const totalAdded = lines.reduce((acc, l) => acc + l.amount, 0);
  const remaining = grandTotal - totalAdded;

  const addLine = () => {
    if (remaining <= 0) {
      toast.error('Ya cubriste el total.');
      return;
    }
    setLines(prev => [...prev, {
      id: crypto.randomUUID(),
      method: 'CREDIT_CARD',
      amount: remaining,
      reference: '',
    }]);
  };

  const updateLine = (id: string, field: keyof PosPaymentSplit, value: string | number) => {
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(prev => prev.filter(l => l.id !== id));
  };

  const handleConfirm = () => {
    if (Math.abs(remaining) > 0.01) {
      toast.error(`El total de los pagos debe ser ${formatCurrency(grandTotal)}`);
      return;
    }
    onConfirm(lines.map(l => ({
      method: l.method === 'STORE_CREDIT' ? 'CUSTOMER_CREDIT' : l.method,
      amount: l.amount,
      reference: l.reference || undefined,
    })));
  };

  return (
    <Modal open={open} onClose={onClose} title="Pago Mixto">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total a cobrar</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#a5b4fc' }}>{formatCurrency(grandTotal)}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>Medios de pago</span>
          <Button variant="ghost" size="sm" onClick={addLine} icon={<Plus size={16} />}>Agregar</Button>
        </div>

        {lines.map(line => (
          <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 2fr auto', gap: '8px', alignItems: 'center' }}>
            <select
              value={line.method}
              onChange={e => updateLine(line.id, 'method', e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
            >
              {METHOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={line.amount}
              onChange={e => updateLine(line.id, 'amount', Number(e.target.value))}
            />
            {line.method !== 'CASH' ? (
              <Input
                placeholder="Referencia / Cupón"
                value={line.reference}
                onChange={e => updateLine(line.id, 'reference', e.target.value)}
              />
            ) : <div />}
            <button onClick={() => removeLine(line.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <span>Falta: <strong style={{ color: remaining === 0 ? '#34d399' : '#f87171' }}>{formatCurrency(remaining)}</strong></span>
          <span>Ingresado: <strong>{formatCurrency(totalAdded)}</strong></span>
        </div>

        <Button
          variant="primary"
          onClick={handleConfirm}
          loading={isLoading}
          disabled={Math.abs(remaining) > 0.01}
          style={{ height: '48px' }}
        >
          Confirmar Pago Mixto
        </Button>
      </div>
    </Modal>
  );
}
