import clsx from 'clsx';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Banknote, FileText, Calendar, AlertTriangle } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  contactMissingMessage,
  resolveManualNotificationRecipient,
} from '@/utils/notificationRecipient';
import { formatPaymentReferenceId, formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  accountId: string | null;
}

export function CurrentAccountDetailDrawer({ open, onClose, accountId }: Props) {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'MOVEMENTS' | 'NEW_RECEIPT'>('MOVEMENTS');

  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptRef, setReceiptRef] = useState('');
  const [receiptDesc, setReceiptDesc] = useState('');

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['finance', 'currentAccounts', accountId],
    queryFn: () => financeApi.getCurrentAccount(accountId!),
    enabled: open && !!accountId,
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: queryKeys.finance.movements(accountId || ''),
    queryFn: () => financeApi.getMovements(accountId!),
    enabled: open && !!accountId && activeTab === 'MOVEMENTS',
  });

  const paymentMutation = useMutation({
    mutationFn: () => financeApi.registerPaymentReceipt(accountId!, { amount: receiptAmount, referenceId: receiptRef, description: receiptDesc }),
    onSuccess: () => {
      toast.success('Pago / Recibo registrado con éxito.');
      queryClient.invalidateQueries({ queryKey: ['finance', 'currentAccounts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.movements(accountId!) });
      setActiveTab('MOVEMENTS');
      setReceiptAmount(0);
      setReceiptRef('');
      setReceiptDesc('');
    },
    onError: (err: any) => toast.error(err.message || 'Error al registrar el recibo'),
  });

  if (!accountId || accountLoading || !account) {
    return <Drawer open={open} onClose={onClose} title="Cargando Cuenta..." width="lg"><div /></Drawer>;
  }

  const isCustomer = account.entityType === 'CUSTOMER';
  const oweText = isCustomer ? 'Saldo Deudor (Nos debe)' : 'Saldo Acreedor (Le debemos)';
  const balanceClass = account.balance > 0
    ? (isCustomer ? styles.balanceAmountCustomerDebt : styles.balanceAmountSupplierDebt)
    : styles.balanceAmountOk;

  const statementRecipient = resolveManualNotificationRecipient(
    { phone: account.phone, email: account.email },
    isCustomer ? 'WHATSAPP' : 'EMAIL',
  );

  const handleSendStatement = async () => {
    const resolved = resolveManualNotificationRecipient(
      { phone: account.phone, email: account.email },
      isCustomer ? 'WHATSAPP' : 'EMAIL',
    );

    if (!resolved) {
      toast.error(contactMissingMessage(isCustomer ? 'El cliente' : 'El proveedor'));
      return;
    }

    try {
      const res = await financeApi.sendManualStatement(account.id, {
        channel: resolved.channel,
        recipient: resolved.recipient,
      });
      toast.success(`${res.message} (${resolved.label})`);
    } catch {
      toast.error('Error al enviar resumen');
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Cuenta Corriente" width="lg">
      <div className={styles.stackMd}>

        <div className="grid-responsive grid-cols-2-1">
          <div className={styles.summaryCard}>
            <Badge color={isCustomer ? 'blue' : 'purple'}>{isCustomer ? 'CLIENTE' : 'PROVEEDOR'}</Badge>
            <h3 className={styles.entityTitle}>{account.entityName}</h3>
            <p className={styles.entityMeta}>
              ID Entidad: <span className={styles.mono}>{formatShortId(account.entityId)}</span>
            </p>

            {account.overdueAmount > 0 && (
              <div className={styles.overdueAlert}>
                <AlertTriangle size={16} /> Deuda Vencida: {formatCurrency(account.overdueAmount)}
              </div>
            )}

            <div className={styles.statementActions}>
              <Button
                variant="outline"
                size="sm"
                icon={<FileText size={14} />}
                onClick={handleSendStatement}
                disabled={!statementRecipient}
              >
                {isCustomer ? 'Enviar Resumen (WhatsApp/Email)' : 'Enviar Resumen (Email)'}
              </Button>
              {statementRecipient ? (
                <span className={styles.hintText}>
                  Se enviará a {statementRecipient.label}
                </span>
              ) : (
                <span className={styles.hintText}>
                  {isCustomer
                    ? 'El cliente no tiene teléfono ni email cargado.'
                    : 'El proveedor no tiene email cargado.'}
                </span>
              )}
            </div>
          </div>

          <div className={styles.balanceCard}>
            <p className={styles.balanceLabel}>{oweText}</p>
            <h2 className={clsx(styles.balanceValue, balanceClass)}>
              {formatCurrency(Math.abs(account.balance))}
            </h2>
            {account.creditLimit && (
              <p className={styles.balanceLimit}>
                Límite de Crédito: {formatCurrency(account.creditLimit)}
              </p>
            )}
          </div>
        </div>

        <div className={styles.tabBar}>
          <Button variant={activeTab === 'MOVEMENTS' ? 'primary' : 'ghost'} onClick={() => setActiveTab('MOVEMENTS')}>Historial y Movimientos</Button>
          <ActionGuard action="manage" subject="Finance">
            <Button variant={activeTab === 'NEW_RECEIPT' ? 'primary' : 'ghost'} onClick={() => setActiveTab('NEW_RECEIPT')} icon={<Banknote size={16} />}>
              Ingresar Pago / Recibo
            </Button>
          </ActionGuard>
        </div>

        {activeTab === 'MOVEMENTS' && (
          <div className={styles.tabContent}>
            {movementsLoading ? (
              <div className={styles.emptyStateLg}>Cargando movimientos...</div>
            ) : !movementsData?.data.length ? (
              <div className={styles.emptyStateLg}>No hay movimientos en esta cuenta.</div>
            ) : (
              <Table
                keyField="id"
                data={movementsData.data}
                columns={[
                  {
                    key: 'date',
                    header: 'Fecha',
                    render: (m) => (
                      <div className={styles.lineCol}>
                        <span className={styles.textMedium}>{new Date(m.date).toLocaleDateString()}</span>
                      </div>
                    )
                  },
                  {
                    key: 'doc',
                    header: 'Documento',
                    render: (m) => {
                      let color = 'gray'; let icon = <FileText size={14} />;
                      if (m.documentType === 'INVOICE') { color = 'blue'; }
                      if (m.documentType === 'RECEIPT') { color = 'green'; icon = <Banknote size={14} />; }
                      if (m.documentType === 'DEBIT_NOTE') { color = 'red'; }
                      if (m.documentType === 'CREDIT_NOTE') { color = 'orange'; }
                      return (
                        <div className={styles.docCol}>
                          <div className={styles.badgeRow}>
                            <Badge color={color as any}>
                              <span className={styles.badgeInner}>{icon} {m.documentType}</span>
                            </Badge>
                          </div>
                          <span className={styles.docRef}>{formatPaymentReferenceId(m.referenceId)}</span>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'debit',
                    header: 'Débito (+)',
                    render: (m) => m.debit > 0 ? <span className={clsx(styles.textBold, styles.textRed)}>{formatCurrency(m.debit)}</span> : '-'
                  },
                  {
                    key: 'credit',
                    header: 'Crédito (-)',
                    render: (m) => m.credit > 0 ? <span className={clsx(styles.textBold, styles.textGreen)}>{formatCurrency(m.credit)}</span> : '-'
                  },
                  {
                    key: 'balance',
                    header: 'Saldo',
                    render: (m) => <span className={styles.textStrong}>{formatCurrency(m.balanceAfter)}</span>
                  },
                  {
                    key: 'dueDate',
                    header: 'Vencimiento',
                    render: (m) => m.dueDate ? (
                      <div className={`${styles.dueDate} ${m.status === 'OVERDUE' ? styles.dueDateOverdue : ''}`}>
                        <Calendar size={12} /> {new Date(m.dueDate).toLocaleDateString()}
                      </div>
                    ) : '-'
                  }
                ]}
              />
            )}
          </div>
        )}

        {activeTab === 'NEW_RECEIPT' && (
          <div className={styles.receiptPanel}>
            <h4 className={styles.receiptTitle}>Registrar {isCustomer ? 'Cobranza (Recibo)' : 'Pago (Orden de Pago)'}</h4>

            <div className={styles.receiptForm}>
              <Input
                label="Monto a Aplicar ($)"
                type="number"
                min="0"
                step="0.01"
                value={receiptAmount}
                onChange={e => setReceiptAmount(Number(e.target.value))}
              />
              <Input
                label="ID de Referencia (Ej: Transferencia Banco X)"
                value={receiptRef}
                onChange={e => setReceiptRef(e.target.value)}
              />
              <div className={styles.textareaGroup}>
                <label className={styles.textareaLabel}>Descripción / Concepto</label>
                <textarea
                  value={receiptDesc}
                  onChange={e => setReceiptDesc(e.target.value)}
                  rows={3}
                  className={styles.textarea}
                />
              </div>

              <div className={styles.receiptSubmit}>
                <Button variant="primary" onClick={() => paymentMutation.mutate()} loading={paymentMutation.isPending} disabled={receiptAmount <= 0 || !receiptRef}>
                  Generar y Aplicar Recibo
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Drawer>
  );
}
