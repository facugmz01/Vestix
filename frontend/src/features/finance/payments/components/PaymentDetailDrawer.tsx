import { useQuery } from '@tanstack/react-query';
import { Drawer, Table, Button } from '@/components/ui';
import { paymentsApi } from '@/api/payments.api';
import { queryKeys } from '@/api/queryKeys';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { CreditCard, Banknote, Landmark, Gift, ExternalLink } from 'lucide-react';

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

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>Ticket Referencia</p>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'monospace' }}>{payment.referenceId}</h3>
            {payment.customerName && <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>{payment.customerName}</p>}
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <PaymentStatusBadge status={payment.status} />
            <span style={{ fontSize: '24px', fontWeight: 900 }}>{fmtCurrency(payment.amount)}</span>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '15px' }}>Desglose de Medios de Pago</h4>
          <Table
            keyField="method"
            data={payment.lines}
            columns={[
              { 
                key: 'method', 
                header: 'Método',
                render: (l) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                    {getMethodIcon(l.method)} {getMethodName(l.method)}
                  </div>
                )
              },
              { 
                key: 'ref', 
                header: 'Referencia',
                render: (l) => <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{l.reference || '-'}</span>
              },
              { 
                key: 'amount', 
                header: 'Monto',
                render: (l) => <span style={{ fontWeight: 800 }}>{fmtCurrency(l.amount)}</span>
              }
            ]}
          />
        </div>

        {payment.gatewayUrl && payment.status === 'PENDING' && (
          <div style={{ padding: '20px', background: 'var(--blue-bg)', borderRadius: '8px', border: '1px solid var(--blue)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px', color: 'var(--blue)' }}>Este cobro se gestiona a través de una pasarela externa.</p>
            <Button variant="primary" icon={<ExternalLink size={16} />} onClick={() => window.open(payment.gatewayUrl, '_blank')}>
              Ir a la Pasarela de Pago
            </Button>
          </div>
        )}

      </div>
    </Drawer>
  );
}
