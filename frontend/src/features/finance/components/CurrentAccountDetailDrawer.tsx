import clsx from 'clsx';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input, Modal } from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { 
  Banknote, 
  FileText, 
  Calendar, 
  AlertTriangle, 
  CreditCard, 
  Link2, 
  CheckCircle2, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  contactMissingMessage,
  resolveManualNotificationRecipient,
} from '@/utils/notificationRecipient';
import { formatPaymentReferenceId, formatShortId } from '@/utils/formatId';
import type { CurrentAccountMovement } from '@/types';
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
  const [selectedFinancialAccountId, setSelectedFinancialAccountId] = useState<string>('');

  // State for linking existing historical movements
  const [linkingMovement, setLinkingMovement] = useState<CurrentAccountMovement | null>(null);
  const [linkingAccountId, setLinkingAccountId] = useState<string>('');
  const [applyBalanceEffect, setApplyBalanceEffect] = useState<boolean>(true);

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

  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['finance', 'treasury', 'accounts'],
    queryFn: () => financeApi.getTreasuryAccounts(),
    enabled: open,
  });

  const financialAccounts = Array.isArray(accountsData) ? accountsData : (accountsData as any)?.data ?? [];

  const paymentMutation = useMutation({
    mutationFn: () =>
      financeApi.registerPaymentReceipt(accountId!, {
        amount: receiptAmount,
        referenceId: receiptRef,
        description: receiptDesc,
        financialAccountId: selectedFinancialAccountId || undefined,
      }),
    onSuccess: () => {
      toast.success('Pago / Recibo registrado e impactado en finanzas.');
      queryClient.invalidateQueries({ queryKey: ['finance', 'currentAccounts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.movements(accountId!) });
      queryClient.invalidateQueries({ queryKey: ['finance', 'treasury', 'accounts'] });
      setActiveTab('MOVEMENTS');
      setReceiptAmount(0);
      setReceiptRef('');
      setReceiptDesc('');
      setSelectedFinancialAccountId('');
    },
    onError: (err: any) => toast.error(err.message || 'Error al registrar el recibo'),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      financeApi.linkMovementFinancialAccount(linkingMovement!.id, {
        financialAccountId: linkingAccountId,
        applyBalanceEffect,
      }),
    onSuccess: () => {
      toast.success('Movimiento vinculado exitosamente a la cuenta de tesorería.');
      queryClient.invalidateQueries({ queryKey: ['finance', 'currentAccounts'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.movements(accountId!) });
      queryClient.invalidateQueries({ queryKey: ['finance', 'treasury', 'accounts'] });
      setLinkingMovement(null);
      setLinkingAccountId('');
    },
    onError: (err: any) => toast.error(err.message || 'Error al vincular la cuenta financiera'),
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
    <>
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
                            {m.description && (
                              <span className={styles.hintText}>{m.description}</span>
                            )}
                          </div>
                        );
                      }
                    },
                    {
                      key: 'financialAccount',
                      header: 'Cuenta de Tesorería',
                      render: (m) => {
                        if (m.financialAccount) {
                          return (
                            <div className={styles.lineCol}>
                              <Badge color="cyan">
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <CreditCard size={12} /> {m.financialAccount.name}
                                </span>
                              </Badge>
                              <span className={styles.hintText} style={{ fontSize: 11 }}>
                                {m.financialAccount.type}
                              </span>
                            </div>
                          );
                        }

                        if (m.documentType === 'RECEIPT') {
                          return (
                            <ActionGuard action="manage" subject="Finance">
                              <button
                                type="button"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 12,
                                  color: 'var(--accent)',
                                  fontWeight: 600,
                                  background: 'var(--accent-subtle)',
                                  border: '1px solid var(--accent-glow)',
                                  borderRadius: 6,
                                  padding: '3px 8px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setLinkingMovement(m);
                                  setLinkingAccountId('');
                                  setApplyBalanceEffect(true);
                                }}
                                title="Vincular este recibo a una cuenta de finanzas"
                              >
                                <Link2 size={12} /> Vincular cuenta
                              </button>
                            </ActionGuard>
                          );
                        }

                        return <span className={styles.hintText}>—</span>;
                      }
                    },
                    {
                      key: 'debit',
                      header: isCustomer ? 'Débito (+)' : 'Pago / Descuento',
                      render: (m) => m.debit > 0 ? <span className={clsx(styles.textBold, styles.textRed)}>{formatCurrency(m.debit)}</span> : '-'
                    },
                    {
                      key: 'credit',
                      header: isCustomer ? 'Crédito (-)' : 'Deuda (+)',
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

                <div className={styles.textareaGroup}>
                  <label className={styles.textareaLabel}>
                    Cuenta de Finanzas / Tesorería ({isCustomer ? 'Destino del cobro' : 'Origen del pago'})
                  </label>
                  <select
                    value={selectedFinancialAccountId}
                    onChange={e => setSelectedFinancialAccountId(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px',
                      fontSize: 14,
                      borderRadius: 8,
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--surface-0)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#1e2029', color: '#fff' }}>
                      — Sin impacto directo en tesorería (Solo ajuste CC) —
                    </option>
                    {accountsLoading ? (
                      <option disabled style={{ backgroundColor: '#1e2029', color: '#999' }}>
                        Cargando cuentas...
                      </option>
                    ) : financialAccounts.length === 0 ? (
                      <option disabled style={{ backgroundColor: '#1e2029', color: '#999' }}>
                        No hay cuentas financieras creadas en Finanzas
                      </option>
                    ) : (
                      financialAccounts.map((fa: any) => (
                        <option key={fa.id} value={fa.id} style={{ backgroundColor: '#1e2029', color: '#fff' }}>
                          {fa.name} ({fa.type}) — Saldo actual: {formatCurrency(fa.balance)}
                        </option>
                      ))
                    )}
                  </select>
                  <span className={styles.hintText} style={{ marginTop: 4 }}>
                    {selectedFinancialAccountId ? (
                      isCustomer ? (
                        <span style={{ color: 'var(--green)' }}>
                          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                          El cobro incrementará automáticamente el saldo de la cuenta seleccionada.
                        </span>
                      ) : (
                        <span style={{ color: 'var(--blue)' }}>
                          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                          El pago se debitará del saldo de la cuenta seleccionada.
                        </span>
                      )
                    ) : (
                      'Podés asociar una cuenta de tesorería (Caja/Banco) o dejarlo como movimiento contable.'
                    )}
                  </span>
                </div>

                <Input
                  label="ID de Referencia (Ej: Transferencia Banco X / Recibo Nº 001)"
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
                    placeholder="Ej: Cobro de saldo pendiente de factura..."
                  />
                </div>

                <div className={styles.receiptSubmit}>
                  <Button
                    variant="primary"
                    onClick={() => paymentMutation.mutate()}
                    loading={paymentMutation.isPending}
                    disabled={receiptAmount <= 0 || !receiptRef}
                  >
                    Generar y Aplicar Recibo
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </Drawer>

      {/* ─── Modal para Vincular Pagos Históricos / Ya Cargados ────────── */}
      {linkingMovement && (
        <Modal
          open={!!linkingMovement}
          title="Vincular Pago a Cuenta de Finanzas"
          onClose={() => setLinkingMovement(null)}
          size="md"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" onClick={() => setLinkingMovement(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => linkMutation.mutate()}
                loading={linkMutation.isPending}
                disabled={!linkingAccountId}
              >
                Confirmar y Vincular
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              Estás por vincular un recibo ya registrado con una cuenta de tesorería / finanzas del sistema.
            </p>

            <div style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              fontSize: 13,
            }}>
              <div><strong>Documento:</strong> {linkingMovement.documentType} ({linkingMovement.referenceId})</div>
              <div><strong>Fecha:</strong> {new Date(linkingMovement.date).toLocaleDateString()}</div>
              <div><strong>Monto:</strong> <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(linkingMovement.credit || linkingMovement.debit || 0)}</span></div>
              {linkingMovement.description && <div><strong>Concepto:</strong> {linkingMovement.description}</div>}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Seleccionar Cuenta Financiera de Destino
              </label>
              <select
                value={linkingAccountId}
                onChange={e => setLinkingAccountId(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface-0)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                <option value="" style={{ backgroundColor: '#1e2029', color: '#fff' }}>
                  — Elegir Cuenta —
                </option>
                {accountsLoading ? (
                  <option disabled style={{ backgroundColor: '#1e2029', color: '#999' }}>
                    Cargando cuentas...
                  </option>
                ) : financialAccounts.length === 0 ? (
                  <option disabled style={{ backgroundColor: '#1e2029', color: '#999' }}>
                    No hay cuentas financieras creadas
                  </option>
                ) : (
                  financialAccounts.map((fa: any) => (
                    <option key={fa.id} value={fa.id} style={{ backgroundColor: '#1e2029', color: '#fff' }}>
                      {fa.name} ({fa.type}) — Saldo actual: {formatCurrency(fa.balance)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={applyBalanceEffect}
                onChange={e => setApplyBalanceEffect(e.target.checked)}
              />
              <span>
                {isCustomer
                  ? 'Acreditar monto en el saldo de la cuenta de tesorería y registrar transacción'
                  : 'Debitar monto del saldo de la cuenta de tesorería y registrar transacción'}
              </span>
            </label>
          </div>
        </Modal>
      )}
    </>
  );
}
