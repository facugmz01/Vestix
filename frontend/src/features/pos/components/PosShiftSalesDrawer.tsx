import { useQuery } from '@tanstack/react-query';
import { Drawer } from '@/components/ui';
import { posApi } from '@/api/pos.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import { PAYMENT_METHOD_LABELS } from '../constants/posPaymentMethods';
import styles from '@/pages/pos/POSPage.module.css';

export function PosShiftSalesDrawer({
  open,
  shiftId,
  onClose,
}: {
  open: boolean;
  shiftId: string | undefined;
  onClose: () => void;
}) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['pos', 'shift-orders', shiftId],
    queryFn: () => posApi.getShiftOrders(shiftId!),
    enabled: open && !!shiftId,
  });

  const total = orders?.reduce((sum, o) => sum + o.grandTotal, 0) ?? 0;

  return (
    <Drawer open={open} onClose={onClose} title="Ventas del turno" width="md">
      {isLoading && <p className={styles.shiftLoading}>Cargando...</p>}
      {!isLoading && (!orders || orders.length === 0) && (
        <p className={styles.shiftEmpty}>No hay ventas en este turno.</p>
      )}
      {orders && orders.length > 0 && (
        <>
          <div className={styles.shiftTotalBox}>
            <div className={styles.shiftTotalLabel}>{orders.length} ventas</div>
            <div className={styles.shiftTotalValue}>{formatCurrency(total)}</div>
          </div>
          <div className={styles.shiftOrderList}>
            {orders.map(o => (
              <div key={o.id} className={styles.shiftOrderCard}>
                <div className={styles.shiftOrderRow}>
                  <span className={styles.shiftOrderId}>
                    {formatSaleId(o.id, o.status)}
                  </span>
                  <span className={styles.shiftOrderTime}>
                    {new Date(o.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={styles.shiftOrderRow}>
                  <span className={styles.shiftOrderAmount}>{formatCurrency(o.grandTotal)}</span>
                </div>
                <div className={styles.shiftOrderCustomer}>{o.customerName}</div>
                <div className={styles.shiftOrderMethod}>
                  {PAYMENT_METHOD_LABELS[o.paymentMethod] || o.paymentMethod}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Drawer>
  );
}
