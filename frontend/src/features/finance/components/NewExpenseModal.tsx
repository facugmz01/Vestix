import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  Button,
  Input,
  Badge,
} from '@/components/ui';
import { financeApi, type CreateExpensePayload } from '@/api/finance.api';
import { treasuryApi } from '@/api/treasury.api';
import { branchesApi } from '@/api/branches.api';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  Wallet,
  Building2,
  AlertTriangle,
  Receipt,
  FileText,
  Calendar,
  DollarSign,
  Plus,
} from 'lucide-react';
import styles from './NewExpenseModal.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenCategories?: () => void;
  preselectedShiftId?: string | null;
  preselectedAccountId?: string | null;
}

export function NewExpenseModal({
  open,
  onClose,
  onOpenCategories,
  preselectedShiftId,
  preselectedAccountId,
}: Props) {
  const queryClient = useQueryClient();

  const [originType, setOriginType] = useState<'CASH_SHIFT' | 'FINANCIAL_ACCOUNT'>('CASH_SHIFT');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [voucherUrl, setVoucherUrl] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: rawCategories } = useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: () => financeApi.getExpenseCategories(),
    enabled: open,
  });
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

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

  const { data: activeShiftData } = useQuery({
    queryKey: ['treasury', 'shifts', 'active'],
    queryFn: () => treasuryApi.getActiveShift(),
    enabled: open && originType === 'CASH_SHIFT',
  });

  const { data: rawBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getBranches(),
    enabled: open,
  });
  const branches = Array.isArray(rawBranches)
    ? rawBranches
    : Array.isArray(rawBranches?.data)
    ? rawBranches.data
    : [];

  // Prepopulate or select default category / account
  useEffect(() => {
    if (open) {
      setFormError(null);
      if (preselectedAccountId) {
        setOriginType('FINANCIAL_ACCOUNT');
        setSelectedAccountId(preselectedAccountId);
      } else if (preselectedShiftId) {
        setOriginType('CASH_SHIFT');
        setSelectedShiftId(preselectedShiftId);
      }
    }
  }, [open, preselectedAccountId, preselectedShiftId]);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (originType === 'FINANCIAL_ACCOUNT' && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [originType, accounts, selectedAccountId]);

  // Selected account live balance check
  const currentAccount = accounts.find((a) => a.id === selectedAccountId);
  const parsedAmount = parseFloat(amount) || 0;
  const isInsufficientFunds =
    originType === 'FINANCIAL_ACCOUNT' &&
    currentAccount &&
    currentAccount.type === 'CASH' &&
    parsedAmount > currentAccount.balance;

  const createMutation = useMutation({
    mutationFn: (payload: CreateExpensePayload) => financeApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['treasury', 'shifts'] });
      handleClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Error al registrar el gasto';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleClose = () => {
    setAmount('');
    setDescription('');
    setNotes('');
    setReceiptNumber('');
    setVoucherUrl('');
    setFormError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryId) {
      setFormError('Debe seleccionar una categoría de gasto');
      return;
    }

    if (parsedAmount <= 0) {
      setFormError('El monto debe ser estrictamente mayor a 0');
      return;
    }

    if (!description.trim()) {
      setFormError('La descripción o concepto es obligatorio');
      return;
    }

    if (originType === 'CASH_SHIFT' && !activeShiftData && !selectedShiftId) {
      setFormError('No hay un turno de caja abierto para registrar el egreso en efectivo.');
      return;
    }

    if (originType === 'FINANCIAL_ACCOUNT' && !selectedAccountId) {
      setFormError('Debe seleccionar la cuenta financiera de origen.');
      return;
    }

    const payload: CreateExpensePayload = {
      expenseCategoryId: categoryId,
      amount: parsedAmount,
      currency: 'ARS',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      description: description.trim(),
      notes: notes.trim() || undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      voucherUrl: voucherUrl.trim() || undefined,
      originType,
      cashShiftId: originType === 'CASH_SHIFT' ? (selectedShiftId || activeShiftData?.id) : undefined,
      financialAccountId: originType === 'FINANCIAL_ACCOUNT' ? selectedAccountId : undefined,
      branchId: selectedBranchId || undefined,
    };

    createMutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Registrar Nuevo Gasto Operativo"
      width="lg"
      footer={
        <div className={styles.footerActions}>
          <Button variant="ghost" onClick={handleClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={parsedAmount <= 0 || !description.trim() || !categoryId}
          >
            Confirmar Gasto
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

        {/* ── 1. SELECTOR DE ORIGEN DE FONDOS ───────────────────────────────── */}
        <div className={styles.sectionBlock}>
          <label className={styles.fieldLabel}>Origen de los Fondos (Forma de Pago)</label>
          <div className={styles.originSelectorGrid}>
            <button
              type="button"
              className={`${styles.originCard} ${originType === 'CASH_SHIFT' ? styles.originCardActive : ''}`}
              onClick={() => setOriginType('CASH_SHIFT')}
            >
              <div className={styles.originCardHeader}>
                <Wallet size={20} className={styles.originIconCash} />
                <span className={styles.originCardTitle}>Caja Chica / Turno POS</span>
              </div>
              <p className={styles.originCardDesc}>
                Egreso directo de efectivo de la caja física en turno activo. Impactará en el arqueo y cierre.
              </p>
              {activeShiftData ? (
                <div className={styles.shiftStatusRow}>
                  <span className={styles.statusDotGreen}></span>
                  <span>Turno Activo: {activeShiftData.cashRegister?.name || 'Caja actual'}</span>
                </div>
              ) : (
                <div className={styles.shiftStatusRow}>
                  <span className={styles.statusDotRed}></span>
                  <span>Sin turno de caja abierto</span>
                </div>
              )}
            </button>

            <button
              type="button"
              className={`${styles.originCard} ${originType === 'FINANCIAL_ACCOUNT' ? styles.originCardActive : ''}`}
              onClick={() => setOriginType('FINANCIAL_ACCOUNT')}
            >
              <div className={styles.originCardHeader}>
                <Building2 size={20} className={styles.originIconBank} />
                <span className={styles.originCardTitle}>Cuenta Bancaria / Billetera</span>
              </div>
              <p className={styles.originCardDesc}>
                Egreso bancario, Mercado Pago o transferencia desde tesorería central.
              </p>
              {currentAccount && (
                <div className={styles.shiftStatusRow}>
                  <span className={styles.balanceTag}>
                    Saldo: {formatCurrency(currentAccount.balance)}
                  </span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Dropdown for specific account when FINANCIAL_ACCOUNT is selected */}
        {originType === 'FINANCIAL_ACCOUNT' && (
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cuenta Financiera de Origen *</label>
              <select
                className={styles.selectInput}
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type}) — Saldo: {formatCurrency(acc.balance)} {acc.currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isInsufficientFunds && (
          <div className={styles.warningBanner}>
            <AlertTriangle size={18} />
            <span>
              Atención: El monto ingresado (${parsedAmount}) supera el saldo disponible en la cuenta ({formatCurrency(currentAccount?.balance ?? 0)}).
            </span>
          </div>
        )}

        {/* ── 2. MONTO, CATEGORÍA Y FECHA ─────────────────────────────────── */}
        <div className={styles.twoColsGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              Monto del Gasto ($ ARS) *
            </label>
            <div className={styles.amountInputWrapper}>
              <DollarSign size={18} className={styles.inputPrefixIcon} />
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelWithAction}>
              <label className={styles.fieldLabel}>Categoría de Gasto *</label>
              {onOpenCategories && (
                <button
                  type="button"
                  className={styles.textActionBtn}
                  onClick={onOpenCategories}
                >
                  <Plus size={14} /> Gestionar
                </button>
              )}
            </div>
            <select
              className={styles.selectInput}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.twoColsGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Fecha de Imputación</label>
            <input
              type="date"
              className={styles.textInput}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sucursal Asignada (Opcional)</label>
            <select
              className={styles.selectInput}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">(Principal / Automática)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── 3. DETALLES Y COMPROBANTE ───────────────────────────────────── */}
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Concepto / Descripción del Gasto *</label>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Ej: Pago de flete, bolsas plásticas para local, abono de internet..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            required
          />
        </div>

        <div className={styles.twoColsGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Nº de Factura / Ticket / Comprobante</label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="Ej: FAC-B 0001-00049281"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Enlace a Comprobante / Voucher</label>
            <input
              type="text"
              className={styles.textInput}
              placeholder="https://drive.google.com/... o referencia"
              value={voucherUrl}
              onChange={(e) => setVoucherUrl(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Notas u Observaciones Internas</label>
          <textarea
            className={styles.textareaInput}
            rows={2}
            placeholder="Observaciones adicionales, proveedor o justificación..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
