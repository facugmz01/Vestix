import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Table, Badge, Button } from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatEntityId, formatShortId } from '@/utils/formatId';
import { Scale, History, FileText } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { AccountAdjustmentModal } from './AccountAdjustmentModal';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  accountId: string | null;
}

export function TreasuryAccountDetailDrawer({ open, onClose, accountId }: Props) {
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'adjustments'>('transactions');

  const { data, isLoading } = useQuery({
    queryKey: ['treasury', 'accounts', accountId, 'transactions'],
    queryFn: () => financeApi.getTreasuryAccountTransactions(accountId!),
    enabled: open && !!accountId,
  });

  const { data: adjustments = [] } = useQuery({
    queryKey: ['treasury', 'accounts', accountId, 'adjustments'],
    queryFn: () => financeApi.getAccountAdjustments(accountId!),
    enabled: open && !!accountId && activeTab === 'adjustments',
  });

  if (!accountId || isLoading || !data) {
    return <Drawer open={open} onClose={onClose} title="Cargando cuenta..." width="lg"><div /></Drawer>;
  }

  const account = data.account;
  const txs = data.data || [];

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={`Cuenta: ${account.name}`}
        width="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <ActionGuard action="manage" subject="Finance">
              <Button
                variant="secondary"
                icon={<Scale size={16} />}
                onClick={() => setAdjustModalOpen(true)}
              >
                Ajustar / Conciliar Saldo
              </Button>
            </ActionGuard>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className={styles.stack}>
          <div className={styles.financeSummary}>
            <div>
              <p className={styles.heroLabel}>Tipo</p>
              <p className={styles.infoValue}>{account.type}</p>
            </div>
            <div>
              <p className={styles.heroLabel}>Saldo Actual</p>
              <p className={styles.infoValue}>{formatCurrency(account.balance)}</p>
            </div>
            <div>
              <p className={styles.heroLabel}>Moneda</p>
              <p className={styles.infoValue}>{account.currency}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '0.5rem' }}>
            <Button
              variant={activeTab === 'transactions' ? 'primary' : 'ghost'}
              size="sm"
              icon={<FileText size={14} />}
              onClick={() => setActiveTab('transactions')}
            >
              Movimientos ({txs.length})
            </Button>
            <Button
              variant={activeTab === 'adjustments' ? 'primary' : 'ghost'}
              size="sm"
              icon={<Scale size={14} />}
              onClick={() => setActiveTab('adjustments')}
            >
              Ajustes de Saldo
            </Button>
          </div>

          {activeTab === 'transactions' ? (
            <>
              <p className={styles.hintText}>
                CREDIT = salida de dinero (ej. pago o gasto). DEBIT = ingreso (ej. cobro o ajuste positivo).
              </p>

              {txs.length === 0 ? (
                <div className={styles.emptyStateLg}>Sin movimientos en esta cuenta.</div>
              ) : (
                <Table
                  keyField="id"
                  data={txs}
                  columns={[
                    {
                      key: 'date',
                      header: 'Fecha',
                      render: (t) => (
                        <span className={styles.textMedium}>
                          {new Date(t.createdAt).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: 'type',
                      header: 'Tipo',
                      render: (t) => (
                        <Badge color={t.type === 'CREDIT' ? 'red' : 'green'}>{t.type}</Badge>
                      ),
                    },
                    {
                      key: 'amount',
                      header: 'Monto',
                      render: (t) => <span className={styles.textBold}>{formatCurrency(t.amount)}</span>,
                    },
                    {
                      key: 'desc',
                      header: 'Concepto',
                      render: (t) => (
                        <div className={styles.lineCol}>
                          <span>{t.description || '—'}</span>
                          {t.referenceId && (
                            <span className={styles.docRef}>
                              Ref. {t.referenceId.includes('-') && t.description?.includes('OC')
                                ? formatEntityId(t.referenceId, 'OC-')
                                : formatShortId(t.referenceId)}
                            </span>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </>
          ) : (
            <>
              <p className={styles.hintText}>
                Registro histórico de ajustes y conciliaciones contables realizadas sobre esta cuenta.
              </p>

              {adjustments.length === 0 ? (
                <div className={styles.emptyStateLg}>No hay ajustes registrados en esta cuenta.</div>
              ) : (
                <Table
                  keyField="id"
                  data={adjustments}
                  columns={[
                    {
                      key: 'date',
                      header: 'Fecha',
                      render: (a) => (
                        <span className={styles.textMedium}>
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: 'type',
                      header: 'Tipo',
                      render: (a) => (
                        <Badge color={a.type === 'INCOME_SURPLUS' ? 'green' : 'red'}>
                          {a.type === 'INCOME_SURPLUS' ? 'SOBRANTE' : 'FALTANTE'}
                        </Badge>
                      ),
                    },
                    {
                      key: 'diff',
                      header: 'Diferencia',
                      render: (a) => (
                        <span className={styles.textBold} style={{ color: a.difference > 0 ? '#10b981' : '#f87171' }}>
                          {a.difference > 0 ? '+' : ''}{formatCurrency(a.difference)}
                        </span>
                      ),
                    },
                    {
                      key: 'reason',
                      header: 'Motivo / Justificación',
                      render: (a) => (
                        <div className={styles.lineCol}>
                          <span>{a.reason}</span>
                          <span className={styles.docRef}>
                            Por: {a.approvedBy?.fullName || a.approvedBy?.email || 'Admin'}
                          </span>
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </>
          )}
        </div>
      </Drawer>

      {adjustModalOpen && (
        <AccountAdjustmentModal
          open={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          account={account}
          accountId={account.id}
        />
      )}
    </>
  );
}

