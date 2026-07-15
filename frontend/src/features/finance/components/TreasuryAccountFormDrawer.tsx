import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import type { FinancialAccount } from '@/types';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';

const ACCOUNT_TYPES = [
  { value: 'CASH', label: 'Caja / Efectivo (CASH)' },
  { value: 'BANK', label: 'Banco / Cuenta corriente (BANK)' },
  { value: 'CREDIT_CARD', label: 'Pasarela / Tarjeta (CREDIT_CARD)' },
  { value: 'EXPENSE', label: 'Caja chica / Gastos (EXPENSE)' },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  accountToEdit?: FinancialAccount | null;
}

export function TreasuryAccountFormDrawer({ open, onClose, accountToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!accountToEdit;

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('CASH');
  const [currency, setCurrency] = useState('ARS');
  const [branchId, setBranchId] = useState('');
  const [initialBalance, setInitialBalance] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const { data: branchesData } = useQuery({
    queryKey: queryKeys.branches.all({ pageSize: 100 }),
    queryFn: () => branchesApi.getBranches({ pageSize: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency || 'ARS');
      setBranchId(accountToEdit.branchId || '');
      setIsActive(accountToEdit.isActive !== false);
      setInitialBalance(0);
    } else {
      setName('');
      setType('CASH');
      setCurrency('ARS');
      setBranchId('');
      setInitialBalance(0);
      setIsActive(true);
    }
  }, [open, accountToEdit]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEditing && accountToEdit) {
        return financeApi.updateTreasuryAccount(accountToEdit.id, {
          name,
          type,
          currency,
          branchId: branchId || null,
          isActive,
        });
      }
      return financeApi.createTreasuryAccount({
        name,
        type,
        currency,
        branchId: branchId || undefined,
        initialBalance: initialBalance > 0 ? initialBalance : undefined,
      });
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Cuenta actualizada' : 'Cuenta de tesorería creada');
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] });
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al guardar la cuenta'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('El nombre es obligatorio');
    mutation.mutate();
  };

  const branches = branchesData?.data || [];

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar cuenta de tesorería' : 'Nueva cuenta de tesorería'}
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Guardar</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formStackMd}>
        <p className={styles.hintText}>
          Las cuentas de tesorería son el dinero real (caja fuerte, banco, MercadoPago).
          Las cajas del POS se vinculan después a una cuenta CASH.
        </p>

        <Input
          label="Nombre *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Caja Principal, Banco Galicia..."
          required
        />

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Tipo *</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={styles.select}>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Sucursal (opcional)</label>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={styles.select}>
            <option value="">Sin sucursal / Global</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
            ))}
          </select>
        </div>

        <Input
          label="Moneda"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        />

        {!isEditing && (
          <Input
            label="Saldo inicial ($)"
            type="number"
            min={0}
            step="0.01"
            value={initialBalance}
            onChange={(e) => setInitialBalance(Number(e.target.value))}
          />
        )}

        {isEditing && (
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="account-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="account-active" className={styles.checkboxLabel}>Cuenta activa</label>
          </div>
        )}
      </form>
    </Drawer>
  );
}
