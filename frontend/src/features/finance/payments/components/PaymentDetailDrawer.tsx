import { useQuery } from '@tanstack/react-query';
import { Drawer, Table, Button } from '@/components/ui';
import { paymentsApi } from '@/api/payments.api';
import { queryKeys } from '@/api/queryKeys';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { CreditCard, Banknote, Landmark, Gift, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatPaymentReferenceId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  paymentId: string | null;
}

export function PaymentDetailDrawer({ open, onClose, paymentId }: Props) {
  const { data: payment, isLoading } = useQuery({
    queryKey: queryKeys.payments.detail(paymentId || ''),
    queryFn: () => paymentsApi.getPayment(paymentId!),
    enabled: open && !!paymentId,
  });

  if (!paymentId || isLoading || !payment) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="md"><div /></Drawer>;
  }

  const getMethodName = (m: string) => {
    switch(m) {
      case 'CASH': return 'Efectivo';
      case 'CREDIT_CARD': return 'Tarjeta Crédito';
      case 'DEBIT_CARD': return 'Tarjeta Débito';
      case 'BANK_TRANSFER': return 'Transferencia';
      case 'STORE_CREDIT': return 'Crédito a Favor';
      default: return m;
    }
  };

  const getMethodIcon = (m: string) => {
    if (m === 'CASH') return <Banknote size={16} />;
    if (m === 'CREDIT_CARD' || m === 'DEBIT_CARD') return <CreditCard size={16} />;
    if (m === 'BANK_TRANSFER') return <Landmark size={16} />;
    return <Gift size={16} />;
  };

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Cobro" width="md">
      <div className={styles.stack}>

        <div className={styles.heroCard}>
          <div>
            <p className={styles.heroLabel}>Ticket Referencia</p>
            <h3 className={styles.heroTitleNeutral}>{formatPaymentReferenceId(payment.referenceId)}</h3>
            {payment.customerName && <p className={styles.statValue}>{payment.customerName}</p>}
          </div>
          <div className={styles.heroAsideCol}>
            <PaymentStatusBadge status={payment.status} />
            <span className={styles.heroAmountMd}>{formatCurrency(payment.amount)}</span>
          </div>
        </div>

        <div>
          <h4 className={styles.sectionHeadingSm}>Desglose de Medios de Pago</h4>
          <Table
            keyField="method"
            data={payment.lines}
            columns={[
              {
                key: 'method',
                header: 'Método',
                render: (l) => (
                  <div className={styles.methodRow}>
                    {getMethodIcon(l.method)} {getMethodName(l.method)}
                  </div>
                )
              },
              {
                key: 'ref',
                header: 'Referencia',
                render: (l) => <span className={styles.mono}>{l.reference || '-'}</span>
              },
              {
                key: 'amount',
                header: 'Monto',
                render: (l) => <span className={styles.textStrong}>{formatCurrency(l.amount)}</span>
              }
            ]}
          />
        </div>

        {payment.gatewayUrl && payment.status === 'PENDING' && (
          <div className={styles.gatewayBox}>
            <p className={styles.gatewayText}>Este cobro se gestiona a través de una pasarela externa.</p>
            <Button variant="primary" icon={<ExternalLink size={16} />} onClick={() => window.open(payment.gatewayUrl, '_blank')}>
              Ir a la Pasarela de Pago
            </Button>
          </div>
        )}

      </div>
    </Drawer>
  );
}
