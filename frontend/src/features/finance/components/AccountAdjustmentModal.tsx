import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  Button,
  Badge,
} from '@/components/ui';
import { financeApi, type AdjustAccountPayload } from '@/api/finance.api';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Scale,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import type { FinancialAccount } from '@/types';
import styles from './AccountAdjustmentModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  account?: FinancialAccount | null;
  accountId?: string | null;
}

export function AccountAdjustmentModal({
  open,
  onClose,
  account: initialAccount,
  accountId: initialAccountId,
}: Props) {
  const queryClient = useQueryClient();

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [adjustedBalanceInput, setAdjustedBalanceInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all accounts if not provided
  const { data: rawAccounts } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: () => financeApi.getTreasuryAccounts(),
    enabled: open,
  });
  const accounts = Array.isArray(rawAccounts)
    ? rawAccounts
    : Array.isArray(rawAccounts?.data)
    ? rawAccounts.data
    : [];

  const activeAccount =
    initialAccount ||
    accounts.find((a) => a.id === (selectedAccountId || initialAccountId)) ||
    accounts[0] ||
    null;

  useEffect(() => {
    if (open) {
      setFormError(null);
      setReason('');
      if (initialAccount) {
        setSelectedAccountId(initialAccount.id);
        setAdjustedBalanceInput(initialAccount.balance.toString());
      } else if (initialAccountId) {
        setSelectedAccountId(initialAccountId);
      } else if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
        setAdjustedBalanceInput(accounts[0].balance.toString());
      }
    }
  }, [open, initialAccount, initialAccountId, accounts]);

  // When selected account changes, set its current balance
  const handleAccountChange = (newId: string) => {
    setSelectedAccountId(newId);
    const acc = accounts.find((a) => a.id === newId);
    if (acc) {
      setAdjustedBalanceInput(acc.balance.toString());
    }
  };

  const previousBalance = activeAccount ? Number(activeAccount.balance) : 0;
  const verifiedBalance = parseFloat(adjustedBalanceInput);
  const isValidNumber = !isNaN(verifiedBalance);
  const difference = isValidNumber ? verifiedBalance - previousBalance : 0;
  const hasDifference = isValidNumber && Math.abs(difference) > 0.0001;
  const isSurplus = difference > 0;
  const isReasonValid = reason.trim().length >= 5;

  const adjustMutation = useMutation({
    mutationFn: (payload: AdjustAccountPayload) =>
      financeApi.adjustAccount(activeAccount!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] });
      if (activeAccount) {
        queryClient.invalidateQueries({
          queryKey: ['treasury', 'accounts', activeAccount.id, 'transactions'],
        });
        queryClient.invalidateQueries({
          queryKey: ['treasury', 'accounts', activeAccount.id, 'adjustments'],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      handleClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Error al procesar el ajuste de saldo';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleClose = () => {
    setFormError(null);
    setReason('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!activeAccount) {
      setFormError('Debe seleccionar una cuenta válida.');
      return;
    }

    if (!isValidNumber) {
      setFormError('Debe ingresar un valor numérico válido para el saldo real verificado.');
      return;
    }

    if (!hasDifference) {
      setFormError('El saldo ingresado es idéntico al saldo actual en sistema. No hay descuadre para ajustar.');
      return;
    }

    if (!isReasonValid) {
      setFormError('El motivo del ajuste es obligatorio y debe tener al menos 5 caracteres.');
      return;
    }

    adjustMutation.mutate({
      adjustedBalance: verifiedBalance,
      reason: reason.trim(),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Ajuste y Conciliación Contable de Saldo"
      width="lg"
      footer={
        <div className={styles.footerActions}>
          <Button variant="ghost" onClick={handleClose} disabled={adjustMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={adjustMutation.isPending}
            disabled={!hasDifference || !isReasonValid || adjustMutation.isPending}
          >
            Confirmar Ajuste
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.formStack}>
        {formError && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={18} />
            <span>{formError}</span>
          </div>
        )}

        <div className={styles.auditWarning}>
          <ShieldAlert size={20} className={styles.warningIcon} />
          <div>
            <p className={styles.auditTitle}>Acción de Auditoría Financiera</p>
            <p className={styles.auditText}>
              Este ajuste registrará automáticamente una transacción compensatoria en el libro mayor de tesorería y quedará asentado en los logs de auditoría forense con tu firma de usuario.
            </p>
          </div>
        </div>

        {/* ── 1. SELECTOR DE CUENTA ────────────────────────────────────────── */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Cuenta Financiera a Conciliar *</label>
          {initialAccount ? (
            <div className={styles.lockedAccountCard}>
              <Building2 size={20} className={styles.accountIcon} />
              <div className={styles.accountMeta}>
                <span className={styles.accountName}>{initialAccount.name}</span>
                <span className={styles.accountSub}>
                  Tipo: {initialAccount.type} — Moneda: {initialAccount.currency}
                </span>
              </div>
            </div>
          ) : (
            <select
              className={styles.selectInput}
              value={activeAccount?.id || ''}
              onChange={(e) => handleAccountChange(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type}) — Saldo actual: {formatCurrency(acc.balance)} {acc.currency}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── 2. COMPARATIVA DE SALDOS Y CÁLCULO DE DIFERENCIA ─────────────── */}
        <div className={styles.balanceComparisonGrid}>
          <div className={styles.balanceBox}>
            <span className={styles.balanceBoxLabel}>Saldo Actual en Sistema</span>
            <span className={styles.balanceBoxValue}>
              {formatCurrency(previousBalance)}
            </span>
            <span className={styles.balanceBoxHint}>Registro según base de datos</span>
          </div>

          <div className={styles.balanceBoxReal}>
            <span className={styles.balanceBoxLabel}>Saldo Real Verificado ($) *</span>
            <input
              type="number"
              step="0.01"
              className={styles.realBalanceInput}
              placeholder="0.00"
              value={adjustedBalanceInput}
              onChange={(e) => setAdjustedBalanceInput(e.target.value)}
              required
              autoFocus
            />
            <span className={styles.balanceBoxHint}>Conteo físico o extracto bancario</span>
          </div>
        </div>

        {/* ── 3. INDICADOR EN TIEMPO REAL DE DIFERENCIA ────────────────────── */}
        <div
          className={`${styles.differenceCard} ${
            !hasDifference
              ? styles.diffNeutral
              : isSurplus
              ? styles.diffSurplus
              : styles.diffDeficit
          }`}
        >
          <div className={styles.diffHeader}>
            <div className={styles.diffIconWrapper}>
              {!hasDifference ? (
                <CheckCircle2 size={20} />
              ) : isSurplus ? (
                <ArrowUpRight size={20} />
              ) : (
                <ArrowDownRight size={20} />
              )}
            </div>
            <div>
              <span className={styles.diffTitle}>
                {!hasDifference
                  ? 'Saldos coincidentes (Sin descuadre)'
                  : isSurplus
                  ? 'Sobrante detectado (Ajuste Positivo)'
                  : 'Faltante / Descuadre detectado (Ajuste Negativo)'}
              </span>
              <p className={styles.diffSubtitle}>
                {!hasDifference
                  ? 'El saldo verificado coincide con el sistema. Modifique el valor para registrar un ajuste.'
                  : isSurplus
                  ? `Se imputará un DEBIT por ${formatCurrency(difference)} para incrementar el saldo de la cuenta.`
                  : `Se imputará un CREDIT por ${formatCurrency(Math.abs(difference))} para descontar el faltante.`}
              </p>
            </div>
          </div>

          {hasDifference && (
            <div className={styles.diffAmountTag}>
              {isSurplus ? '+' : ''}
              {formatCurrency(difference)}
            </div>
          )}
        </div>

        {/* ── 4. JUSTIFICACIÓN Y MOTIVO MANDATORIO ─────────────────────────── */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>
            Motivo del Ajuste y Justificación Contable (Obligatorio) *
          </label>
          <textarea
            className={styles.textareaInput}
            rows={3}
            placeholder="Describa el origen de la diferencia (ej: Comisión bancaria no facturada, redondeo de caja chica, extracto bancario de fin de mes, dinero extraviado)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={5}
          />
          <div className={styles.charCounter}>
            {reason.trim().length < 5 ? (
              <span className={styles.counterWarning}>Mínimo 5 caracteres requeridos</span>
            ) : (
              <span className={styles.counterOk}>Justificación válida</span>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
