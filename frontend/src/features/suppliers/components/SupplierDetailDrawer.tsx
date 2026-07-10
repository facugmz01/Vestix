import clsx from 'clsx';
import { Drawer, Button, Table } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { suppliersApi } from '@/api/suppliers.api';
import type { Supplier } from '@/types';
import { Briefcase, CreditCard, Receipt, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export function SupplierDetailDrawer({ open, onClose, supplier }: Props) {
  if (!supplier) return null;

  const hasDebt = (supplier.account?.balance || 0) > 0;

  const { data: ledger, isLoading } = useQuery({
    queryKey: queryKeys.suppliers.ledger(supplier.id),
    queryFn: () => suppliersApi.getLedger(supplier.id),
    enabled: open,
  });

  return (
    <Drawer open={open} onClose={onClose} title="Ficha del Proveedor" width="lg">
      <div className={styles.stack}>
        <div className={styles.profileHeader}>
          <div className={styles.entityIconBox}>
            <Briefcase size={28} />
          </div>
          <div>
            <h3 className={styles.profileTitle}>{supplier.companyName}</h3>
            <p className={styles.profileMeta}>
              CUIT: {supplier.taxId || 'No registrado'} • Contacto: {supplier.contactName || 'No especificado'}
            </p>
            {supplier.email && (
              <p className={styles.entityEmail}>{supplier.email}</p>
            )}
          </div>
        </div>

        <div className={clsx(styles.balancePanel, hasDebt && styles.balancePanelDebt)}>
          <div className={styles.sectionHeaderRow}>
            <CreditCard size={18} className={hasDebt ? styles.textRed : undefined} />
            <h4 className={styles.sectionHeaderTitle}>Estado de Cuenta</h4>
          </div>
          <div className={styles.balanceAmountRow}>
            <span className={clsx(styles.balanceAmount, hasDebt ? styles.balanceAmountDebt : styles.balanceAmountOk)}>
              {formatCurrency(supplier.account?.balance || 0, supplier.account?.currency || 'ARS')}
            </span>
            <span className={styles.balanceCaption}>
              {hasDebt ? 'Saldo pendiente a pagar' : 'Al día'}
            </span>
          </div>
          {hasDebt && (
            <div className={styles.balanceAction}>
              <Button variant="primary" size="sm" icon={<Receipt size={14} />}>Registrar Pago</Button>
            </div>
          )}
        </div>

        <div>
          <div className={styles.sectionHeaderRow}>
            <FileText size={18} className={styles.textMuted} />
            <h4 className={styles.sectionHeaderTitleLg}>Libro Mayor (Últimos Movimientos)</h4>
          </div>
          
          <div className={styles.historyTableWrap}>
            {isLoading ? (
              <div className={styles.emptyCenter}>Cargando movimientos...</div>
            ) : (!ledger || ledger.length === 0) ? (
              <div className={styles.emptyCenter}>Sin movimientos financieros recientes.</div>
            ) : (
              <Table
                keyField="id"
                data={ledger}
                columns={[
                  { key: 'date', header: 'Fecha', render: (l) => new Date(l.date).toLocaleDateString() },
                  { key: 'concept', header: 'Concepto', render: (l) => l.concept },
                  { key: 'debit', header: 'Debe (Pagos)', render: (l) => l.debit > 0 ? <span className={styles.textGreen}>{formatCurrency(l.debit, supplier.account?.currency)}</span> : '-' },
                  { key: 'credit', header: 'Haber (Facturas)', render: (l) => l.credit > 0 ? <span className={styles.textRed}>{formatCurrency(l.credit, supplier.account?.currency)}</span> : '-' },
                  { key: 'balance', header: 'Saldo', render: (l) => <strong>{formatCurrency(l.balance, supplier.account?.currency)}</strong> }
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
