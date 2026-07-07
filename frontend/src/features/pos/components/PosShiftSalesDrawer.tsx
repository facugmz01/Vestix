import { useQuery } from '@tanstack/react-query';
import { Drawer } from '@/components/ui';
import { posApi } from '@/api/pos.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { PAYMENT_METHOD_LABELS } from '../constants/posPaymentMethods';

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
      {isLoading && <p style={{ color: 'var(--text-muted)' }}>Cargando...</p>}
      {!isLoading && (!orders || orders.length === 0) && (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No hay ventas en este turno.</p>
      )}
      {orders && orders.length > 0 && (
        <>
          <div style={{
            padding: '16px', marginBottom: '16px', background: 'rgba(16,185,129,0.1)',
            borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{orders.length} ventas</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>{formatCurrency(total)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orders.map(o => (
              <div key={o.id} style={{
                padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{formatCurrency(o.grandTotal)}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(o.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>{o.customerName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
