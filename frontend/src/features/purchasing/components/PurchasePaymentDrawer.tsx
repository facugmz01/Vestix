import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button, Input, Drawer } from '@/components/ui';
import { apiClient } from '@/api/client';
import styles from '@/pages/admin/NewPurchasePage.module.css';

export type PurchasePaymentPayload = {
  paymentAccountId?: string;
  paymentAmount: number;
  notes?: string;
  paymentReference?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  totalAmount: number;
  /** Monto máximo pendiente (para pagos parciales posteriores) */
  maxAmount?: number;
  confirmLabel?: string;
  loading?: boolean;
  /** Si true, exige cuenta: no permite solo deuda (para registrar pago) */
  requirePayment?: boolean;
  onConfirm: (payload: PurchasePaymentPayload) => void;
};

export function PurchasePaymentDrawer({
  open,
  onClose,
  title = 'Confirmar compra y pago',
  totalAmount,
  maxAmount,
  confirmLabel = 'Confirmar',
  loading = false,
  requirePayment = false,
  onConfirm,
}: Props) {
  const ceiling = maxAmount ?? totalAmount;
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(ceiling);
  const [notes, setNotes] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  const { data: accounts } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: () => apiClient.get('/finance/treasury/accounts').then(res => res.data),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    setPaymentAmount(ceiling);
    setNotes('');
    setPaymentReference('');
    if (!requirePayment) setPaymentAccountId('');
  }, [open, ceiling, requirePayment]);

  const effectivePaid = paymentAccountId || requirePayment ? paymentAmount : 0;
  const remaining = Math.max(0, totalAmount - effectivePaid);

  return (
    <Drawer open={open} onClose={onClose} title={title} width="sm">
      <div className={styles.drawerStack}>
        <div className={styles.paymentHero}>
          <p className={styles.paymentHeroLabel}>
            {requirePayment ? 'Saldo pendiente' : 'Total a pagar / facturado'}
          </p>
          <h1 className={styles.paymentHeroValue}>{formatCurrency(requirePayment ? ceiling : totalAmount)}</h1>
        </div>

        <div className={styles.drawerField}>
          <label className={styles.drawerLabel} htmlFor="payment-account">Cuenta de origen (pago)</label>
          <select
            id="payment-account"
            value={paymentAccountId}
            onChange={e => {
              const id = e.target.value;
              setPaymentAccountId(id);
              if (id) setPaymentAmount(ceiling);
            }}
            className={styles.drawerSelect}
          >
            {!requirePayment && (
              <option value="">No pagar ahora (deuda / cuenta corriente)</option>
            )}
            {requirePayment && <option value="">Seleccionar cuenta...</option>}
            {(accounts?.data || accounts || []).map((a: { id: string; name: string; balance: number }) => (
              <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
            ))}
          </select>
        </div>

        {(paymentAccountId || requirePayment) && (
          <>
            <div className={styles.drawerField}>
              <label className={styles.drawerLabel} htmlFor="payment-amount">Monto a pagar ahora ($)</label>
              <Input
                id="payment-amount"
                type="number"
                max={ceiling}
                min={0}
                step="0.01"
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className={styles.paymentInputLg}
              />
              {!requirePayment && paymentAccountId && remaining > 0 && (
                <p className={styles.hintText}>
                  La diferencia ({formatCurrency(remaining)}) se carga como deuda al proveedor.
                </p>
              )}
            </div>
            <div className={styles.drawerField}>
              <label className={styles.drawerLabel} htmlFor="payment-ref">Referencia del pago</label>
              <Input
                id="payment-ref"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Ej: Transferencia nro, cheque, cupón..."
              />
            </div>
          </>
        )}

        {!paymentAccountId && !requirePayment && (
          <div className={styles.debtAlert}>
            <strong>Atención:</strong> Se generará una deuda de <strong>{formatCurrency(totalAmount)}</strong> con el proveedor en cuenta corriente.
          </div>
        )}

        <div className={styles.drawerField}>
          <label className={styles.drawerLabel} htmlFor="payment-notes">Observaciones / factura</label>
          <textarea
            id="payment-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej: Factura A nro 0001-00001234"
            className={styles.drawerTextarea}
          />
        </div>

        <div className={styles.drawerFooter}>
          <Button
            variant="primary"
            className={styles.submitBtnFull}
            loading={loading}
            disabled={requirePayment && !paymentAccountId}
            onClick={() => onConfirm({
              paymentAccountId: paymentAccountId || undefined,
              paymentAmount: paymentAccountId || requirePayment ? paymentAmount : 0,
              notes: notes || undefined,
              paymentReference: paymentReference || undefined,
            })}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
