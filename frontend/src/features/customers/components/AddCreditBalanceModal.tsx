import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input } from '@/components/ui';
import { Wallet, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '@/api/customers.api';
import { financeApi } from '@/api/finance.api';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Customer } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function AddCreditBalanceModal({ open, onClose, customer }: Props) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [financialAccountId, setFinancialAccountId] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');

  const { data: accountsData } = useQuery({
    queryKey: ['finance', 'treasury', 'accounts'],
    queryFn: () => financeApi.getTreasuryAccounts(),
    enabled: open,
  });

  const financialAccounts = Array.isArray(accountsData) ? accountsData : (accountsData as any)?.data ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      if (!customer) throw new Error('No hay cliente seleccionado');
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Ingresá un monto válido mayor a 0');
      }
      return customersApi.addCreditBalance(customer.id, {
        amount: numAmount,
        paymentMethod,
        financialAccountId: financialAccountId || undefined,
        reference: reference.trim() || undefined,
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Saldo a favor acreditado con éxito');
      queryClient.invalidateQueries({ queryKey: ['customer', customer?.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'currentAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance', 'treasury', 'accounts'] });
      setAmount('');
      setReference('');
      setDescription('');
      setFinancialAccountId('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al cargar saldo a favor');
    },
  });

  if (!customer) return null;

  const currentBalance = Number(customer.creditBalance) || 0;

  return (
    <Modal open={open} onClose={onClose} title="Cargar Saldo a Favor">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Cliente</div>
            <strong style={{ fontSize: 15 }}>{customer.fullName}</strong>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Saldo actual</div>
            <span style={{ color: 'var(--green, #10b981)', fontWeight: 700, fontSize: 16 }}>
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        <Input
          label="Monto a acreditar ($)"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
          required
        />

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            Medio de Cobro
          </label>
          <select
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--surface-0)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          >
            <option value="CASH">Efectivo</option>
            <option value="BANK_TRANSFER">Transferencia Bancaria</option>
            <option value="DEBIT_CARD">Tarjeta de Débito</option>
            <option value="CREDIT_CARD">Tarjeta de Crédito</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
            Cuenta de Tesorería de Destino (Caja / Banco)
          </label>
          <select
            value={financialAccountId}
            onChange={e => setFinancialAccountId(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              padding: '0 12px',
              borderRadius: 8,
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--surface-0)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          >
            <option value="">— Sin impacto en tesorería (Solo saldo en cuenta) —</option>
            {financialAccounts.map((acc: any) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.type}) — Saldo: {formatCurrency(acc.balance)}
              </option>
            ))}
          </select>
          <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
            {financialAccountId ? (
              <span style={{ color: 'var(--green, #10b981)' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                El cobro incrementará el saldo de la caja o banco seleccionado.
              </span>
            ) : (
              'Si no seleccionás cuenta, se registra como crédito a favor sin movimiento de caja.'
            )}
          </span>
        </div>

        <Input
          label="Comprobante / Referencia (opcional)"
          placeholder="Ej: Transferencia Nº 987654 / Recibo Nº 001"
          value={reference}
          onChange={e => setReference(e.target.value)}
        />

        <Input
          label="Concepto / Observaciones (opcional)"
          placeholder="Ej: Anticipo para próxima compra / Seña"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!amount || Number(amount) <= 0}
            icon={<Wallet size={16} />}
          >
            Acreditar Saldo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
