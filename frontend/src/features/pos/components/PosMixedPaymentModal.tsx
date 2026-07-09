import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { usePosStore } from '../store/usePosStore';
import type { PaymentMethodType } from '@/types';
import styles from '@/pages/pos/POSPage.module.css';

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
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);
  const [lines, setLines] = useState<PosPaymentSplit[]>([
    { id: '1', method: 'CASH', amount: grandTotal, reference: '' },
  ]);

  useEffect(() => {
    if (open) {
      setLines([{ id: '1', method: 'CASH', amount: grandTotal, reference: '' }]);
    }
  }, [open, grandTotal]);

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
    if (lines.some(l => l.method === 'STORE_CREDIT') && !selectedCustomerId) {
      toast.error('Seleccioná un cliente para usar Cuenta Corriente en el pago mixto');
      return;
    }
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
      <div className={styles.mixedStack}>
        <div className={styles.mixedTotalBox}>
          <div className={styles.mixedTotalLabel}>Total a cobrar</div>
          <div className={styles.mixedTotalValue}>{formatCurrency(grandTotal)}</div>
        </div>

        <div className={styles.mixedHeader}>
          <span>Medios de pago</span>
          <Button variant="ghost" size="sm" onClick={addLine} icon={<Plus size={16} />}>Agregar</Button>
        </div>

        {lines.map(line => (
          <div key={line.id} className={styles.mixedLine}>
            <select
              value={line.method}
              onChange={e => updateLine(line.id, 'method', e.target.value)}
              className={styles.mixedSelect}
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
            <button type="button" onClick={() => removeLine(line.id)} className={styles.mixedRemoveBtn}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <div className={styles.mixedSummary}>
          <span>
            Falta: <strong className={remaining === 0 ? styles.mixedOk : styles.mixedFail}>{formatCurrency(remaining)}</strong>
          </span>
          <span>Ingresado: <strong>{formatCurrency(totalAdded)}</strong></span>
        </div>

        <Button
          variant="primary"
          onClick={handleConfirm}
          loading={isLoading}
          disabled={Math.abs(remaining) > 0.01}
          className={styles.mixedConfirmBtn}
        >
          Confirmar Pago Mixto
        </Button>
      </div>
    </Modal>
  );
}
