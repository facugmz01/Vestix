import { useQuery } from '@tanstack/react-query';
import { Drawer, Table, Badge } from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatEntityId, formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  accountId: string | null;
}

export function TreasuryAccountDetailDrawer({ open, onClose, accountId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['treasury', 'accounts', accountId, 'transactions'],
    queryFn: () => financeApi.getTreasuryAccountTransactions(accountId!),
    enabled: open && !!accountId,
  });

  if (!accountId || isLoading || !data) {
    return <Drawer open={open} onClose={onClose} title="Cargando cuenta..." width="lg"><div /></Drawer>;
  }

  const account = data.account;
  const txs = data.data || [];

  return (
    <Drawer open={open} onClose={onClose} title={`Cuenta: ${account.name}`} width="lg">
      <div className={styles.stack}>
        <div className={styles.financeSummary}>
          <div>
            <p className={styles.heroLabel}>Tipo</p>
            <p className={styles.infoValue}>{account.type}</p>
          </div>
          <div>
            <p className={styles.heroLabel}>Saldo</p>
            <p className={styles.infoValue}>{formatCurrency(account.balance)}</p>
          </div>
          <div>
            <p className={styles.heroLabel}>Moneda</p>
            <p className={styles.infoValue}>{account.currency}</p>
          </div>
        </div>

        <p className={styles.hintText}>
          CREDIT = salida de dinero (ej. pago a proveedor). DEBIT = ingreso (ej. cobro de venta).
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
      </div>
    </Drawer>
  );
}
