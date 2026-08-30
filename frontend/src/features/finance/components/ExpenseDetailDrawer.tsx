import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  Button,
  Badge,
  ConfirmDialog,
} from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatEntityId, formatShortId } from '@/utils/formatId';
import {
  Receipt,
  Building2,
  Wallet,
  Calendar,
  User,
  Store,
  FileText,
  ExternalLink,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import styles from './ExpenseDetailDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  expenseId: string | null;
}

export function ExpenseDetailDrawer({ open, onClose, expenseId }: Props) {
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: expense, isLoading } = useQuery({
    queryKey: ['expenses', expenseId],
    queryFn: () => financeApi.getExpenseById(expenseId!),
    enabled: open && !!expenseId,
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => financeApi.cancelExpense(expenseId!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['treasury', 'accounts'] });
      setCancelModalOpen(false);
      setCancelReason('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Error al anular el gasto';
      setCancelError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  if (!expenseId || isLoading || !expense) {
    return (
      <Drawer open={open} onClose={onClose} title="Detalle de Gasto" width="md">
        <div className={styles.loadingPlaceholder}>Cargando información del gasto...</div>
      </Drawer>
    );
  }

  const isCancelled = expense.status === 'CANCELLED';

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      setCancelError('Debe ingresar un motivo para la anulación.');
      return;
    }
    cancelMutation.mutate(cancelReason.trim());
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={`Gasto Operativo #${formatShortId(expense.id)}`}
        width="md"
        footer={
          <div className={styles.drawerFooter}>
            {!isCancelled && (
              <ActionGuard action="manage" subject="Finance">
                <Button
                  variant="danger"
                  icon={<Ban size={16} />}
                  onClick={() => {
                    setCancelError(null);
                    setCancelModalOpen(true);
                  }}
                >
                  Anular Gasto
                </Button>
              </ActionGuard>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className={styles.drawerBody}>
          {/* Header Amount Card */}
          <div
            className={`${styles.heroAmountCard} ${
              isCancelled ? styles.heroCancelled : styles.heroPaid
            }`}
          >
            <div className={styles.heroAmountMeta}>
              <span className={styles.heroLabel}>Monto Imputado</span>
              <span className={styles.heroAmount}>
                {formatCurrency(expense.amount)} {expense.currency}
              </span>
            </div>
            <Badge color={isCancelled ? 'red' : 'green'}>
              {isCancelled ? 'ANULADO' : 'PAGADO'}
            </Badge>
          </div>

          {/* Core Info Grid */}
          <div className={styles.infoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Categoría</span>
              <span className={styles.categoryBadge}>
                {expense.expenseCategory.name}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha</span>
              <span className={styles.infoValue}>
                {new Date(expense.date).toLocaleString()}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Concepto</span>
              <span className={styles.infoValueBold}>{expense.description}</span>
            </div>

            {expense.receiptNumber && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nº Comprobante</span>
                <span className={styles.receiptTag}>{expense.receiptNumber}</span>
              </div>
            )}

            {expense.voucherUrl && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Comprobante Adjunto</span>
                <a
                  href={expense.voucherUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.linkButton}
                >
                  <ExternalLink size={14} /> Ver Comprobante
                </a>
              </div>
            )}
          </div>

          {/* Funding Source Card */}
          <div className={styles.sectionCard}>
            <span className={styles.sectionCardTitle}>Origen de Fondos</span>
            {expense.cashShift ? (
              <div className={styles.originDetailRow}>
                <Wallet size={18} className={styles.cashIcon} />
                <div>
                  <p className={styles.originTitle}>
                    Caja Registradora: {expense.cashShift.cashRegister?.name || 'Caja física'}
                  </p>
                  <p className={styles.originSub}>
                    Turno #{formatShortId(expense.cashShift.id)}
                  </p>
                </div>
              </div>
            ) : expense.financialAccount ? (
              <div className={styles.originDetailRow}>
                <Building2 size={18} className={styles.bankIcon} />
                <div>
                  <p className={styles.originTitle}>
                    {expense.financialAccount.name} ({expense.financialAccount.type})
                  </p>
                  <p className={styles.originSub}>
                    Egreso imputado a cuenta de tesorería
                  </p>
                </div>
              </div>
            ) : (
              <span className={styles.infoValue}>—</span>
            )}
          </div>

          {/* Traceability and Audit */}
          <div className={styles.sectionCard}>
            <span className={styles.sectionCardTitle}>Trazabilidad y Auditoría</span>
            <div className={styles.auditStack}>
              <div className={styles.auditItem}>
                <User size={15} className={styles.auditIcon} />
                <span>Registrado por: <strong>{expense.createdBy?.fullName || expense.createdBy?.email}</strong></span>
              </div>

              {expense.branch && (
                <div className={styles.auditItem}>
                  <Store size={15} className={styles.auditIcon} />
                  <span>Sucursal: <strong>{expense.branch.name} ({expense.branch.code})</strong></span>
                </div>
              )}

              {expense.financialTransaction && (
                <div className={styles.auditItem}>
                  <FileText size={15} className={styles.auditIcon} />
                  <span>Transacción de Libro Mayor: <strong>{expense.financialTransaction.referenceId} ({expense.financialTransaction.type})</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className={styles.notesBlock}>
              <span className={styles.notesTitle}>Observaciones / Historial</span>
              <p className={styles.notesText}>{expense.notes}</p>
            </div>
          )}
        </div>
      </Drawer>

      {/* Modal de confirmación para anulación */}
      {cancelModalOpen && (
        <ConfirmDialog
          open={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleConfirmCancel}
          title="¿Anular este gasto operativo?"
          message="Esta acción revertirá automáticamente los fondos en la cuenta de origen o caja registradora correspondiente, dejando registro en el libro mayor y en el log de auditoría."
          confirmLabel="Confirmar Anulación"
          cancelLabel="Volver"
          variant="danger"
          loading={cancelMutation.isPending}
        >
          <div className={styles.cancelReasonBox}>
            <label className={styles.cancelLabel}>Motivo de la anulación *</label>
            <input
              type="text"
              className={styles.cancelInput}
              placeholder="Ej: Factura duplicada, error en el monto, reintegro de proveedor..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              autoFocus
            />
            {cancelError && <p className={styles.cancelErrorText}>{cancelError}</p>}
          </div>
        </ConfirmDialog>
      )}
    </>
  );
}
