import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { reservationsApi } from '@/api/reservations.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, PackageSearch, User } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';

interface Props {
  open: boolean;
  onClose: () => void;
  reservationId: string | null;
}

export function ReservationDetailDrawer({ open, onClose, reservationId }: Props) {
  const queryClient = useQueryClient();

  const [saleId, setSaleId] = useState('');

  const { data: res, isLoading } = useQuery({
    queryKey: queryKeys.reservations.detail(reservationId || ''),
    queryFn: () => reservationsApi.getReservation(reservationId!),
    enabled: open && !!reservationId,
  });

  const consumeMutation = useMutation({
    mutationFn: () => reservationsApi.consumeReservation(reservationId!, saleId || undefined),
    onSuccess: () => {
      toast.success('Reserva concretada (Consumida).');
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.detail(reservationId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al consumir'),
  });

  const releaseMutation = useMutation({
    mutationFn: () => reservationsApi.releaseReservation(reservationId!),
    onSuccess: () => {
      toast.success('Reserva liberada. El stock vuelve a estar disponible.');
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.detail(reservationId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al liberar'),
  });

  // Calculate Expiration
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpiredLocally, setIsExpiredLocally] = useState(false);

  useEffect(() => {
    if (!res || res.status !== 'ACTIVE') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const exp = new Date(res.expiresAt).getTime();
      const distance = exp - now;

      if (distance < 0) {
        setIsExpiredLocally(true);
        setTimeLeft('VENCIDA');
        clearInterval(interval);
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${h}h ${m}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [res]);

  if (!reservationId || isLoading || !res) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="md"><div /></Drawer>;
  }

  const getStatusColor = (s: string) => {
    if (s === 'ACTIVE') return 'green';
    if (s === 'CONSUMED') return 'blue';
    if (s === 'RELEASED') return 'gray';
    if (s === 'EXPIRED') return 'red';
    return 'gray';
  };

  return (
    <Drawer open={open} onClose={onClose} title="Auditoría de Reserva de Stock" width="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>ID Reserva</p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace' }}>{res.id.split('-')[0]}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> {res.customerName || 'Consumidor Final (Sin nombre)'}
            </p>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <Badge color={getStatusColor(res.status)}>{res.status}</Badge>
            {res.status === 'ACTIVE' && (
              <Badge color={isExpiredLocally ? 'red' : 'warning'} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Clock size={12} /> Expira en: {timeLeft}
              </Badge>
            )}
          </div>
        </div>

        {/* Lines */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageSearch size={18} /> Artículos Retenidos
          </h4>
          
          <Table
            keyField="id"
            data={res.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
              { key: 'qty', header: 'Cant. Retenida', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.quantity}</span> },
            ]}
          />
        </div>

        {res.notes && (
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px dashed var(--border)', borderRadius: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Notas:</span>
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{res.notes}</p>
          </div>
        )}

        {/* Actions Contextual to Status */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          
          {res.status === 'ACTIVE' && (
            <ActionGuard action="manage" subject="Inventory">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ padding: '16px', background: 'var(--blue-bg)', borderRadius: '8px', border: '1px solid var(--blue)' }}>
                  <h4 style={{ margin: '0 0 8px', color: 'var(--blue)', fontSize: '14px' }}>¿Se concretó la venta?</h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <Input label="ID del Ticket de Venta (Opcional)" value={saleId} onChange={e => setSaleId(e.target.value)} placeholder="Ej: VENTA-001" />
                    </div>
                    <Button variant="primary" onClick={() => consumeMutation.mutate()} loading={consumeMutation.isPending} disabled={releaseMutation.isPending}>
                      Consumir Reserva
                    </Button>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <Button variant="ghost" onClick={() => releaseMutation.mutate()} loading={releaseMutation.isPending} disabled={consumeMutation.isPending} style={{ color: 'var(--red)' }}>
                    Liberar Mercadería (Cancelar)
                  </Button>
                </div>
              </div>
            </ActionGuard>
          )}

          {res.status === 'CONSUMED' && (
            <div style={{ padding: '12px', background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 600 }}>Reserva Concretada. La mercadería se vendió.</span>
            </div>
          )}

          {(res.status === 'RELEASED' || res.status === 'EXPIRED') && (
            <div style={{ padding: '12px', background: 'var(--gray-bg)', color: 'var(--text-secondary)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontWeight: 600 }}>Reserva Anulada o Vencida. Stock liberado.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
