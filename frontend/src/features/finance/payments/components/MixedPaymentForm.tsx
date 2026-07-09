import clsx from 'clsx';
import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import type { PaymentMethodType } from '@/types';
import { Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';

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

  const updateLine = (id: string, field: keyof MixedPaymentLine, value: string | number) => {
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
    <div className={styles.paymentPanel}>
      <div className={styles.paymentPanelHeader}>
        <h3 className={styles.paymentPanelTitle}>Medios de Pago</h3>
        <Button variant="ghost" size="sm" onClick={addLine} icon={<Plus size={16} />}>Dividir Pago</Button>
      </div>

      <div className={styles.paymentLines}>
        {lines.map((l) => (
          <div key={l.id} className={styles.paymentLine}>
            <div className={styles.paymentLineGrow2}>
              <select 
                value={l.method} 
                onChange={e => updateLine(l.id, 'method', e.target.value)}
                className={clsx(styles.select, styles.selectFull)}
              >
                <option value="CASH">Efectivo</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="DEBIT_CARD">Tarjeta de Débito</option>
                <option value="BANK_TRANSFER">Transferencia</option>
                <option value="STORE_CREDIT">Crédito a Favor</option>
              </select>
            </div>
            
            <div className={styles.paymentLineGrow2}>
              <Input 
                type="number" min="0" step="0.01" 
                value={l.amount} 
                onChange={e => updateLine(l.id, 'amount', Number(e.target.value))}
              />
            </div>

            {l.method !== 'CASH' && (
              <div className={styles.paymentLineGrow2}>
                <Input 
                  placeholder="Referencia (Ej: L4T 1234)" 
                  value={l.reference} 
                  onChange={e => updateLine(l.id, 'reference', e.target.value)}
                />
              </div>
            )}

            <div className={styles.paymentLineActions}>
              <Trash2 size={20} color="var(--red)" className={styles.clickable} onClick={() => removeLine(l.id)} />
            </div>
          </div>
        ))}
      </div>

      <div className={clsx(styles.paymentSummary, remaining === 0 ? styles.paymentSummaryOk : styles.paymentSummaryPending)}>
        <div>
          <p className={styles.paymentSummaryLabel}>Falta Pagar</p>
          <span className={clsx(styles.paymentSummaryAmount, remaining === 0 ? styles.paymentSummaryAmountOk : styles.paymentSummaryAmountPending)}>
            {formatCurrency(remaining)}
          </span>
        </div>
        <div className={styles.paymentSummaryAside}>
          <p className={styles.paymentSummaryLabel}>Total Ingresado</p>
          <span className={styles.paymentSummaryTotal}>{formatCurrency(totalAdded)}</span>
        </div>
      </div>

      <Button 
        variant="primary" 
        className={styles.paymentSubmitBtn}
        onClick={handleSubmit}
        disabled={totalAdded !== targetAmount || isLoading}
        loading={isLoading}
      >
        Procesar Pago ({lines.length} métodos)
      </Button>
    </div>
  );
}
