import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { reservationsApi } from '@/api/reservations.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, PackageSearch, User } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

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
      <div className={styles.stackMd}>

        <div className={styles.heroCard}>
          <div>
            <p className={styles.heroLabel}>ID Reserva</p>
            <h3 className={styles.heroTitleNeutral}>{formatShortId(res.id)}</h3>
            <p className={styles.reservationCustomer}>
              <User size={14} /> {res.customerName || 'Consumidor Final (Sin nombre)'}
            </p>
          </div>
          <div className={styles.heroAsideStack}>
            <Badge color={getStatusColor(res.status)}>{res.status}</Badge>
            {res.status === 'ACTIVE' && (
              <Badge color={isExpiredLocally ? 'red' : 'warning'}>
                <span className={styles.expireBadgeInner}><Clock size={12} /> Expira en: {timeLeft}</span>
              </Badge>
            )}
          </div>
        </div>

        <div>
          <h4 className={styles.sectionHeading}>
            <PackageSearch size={18} /> Artículos Retenidos
          </h4>

          <Table
            keyField="id"
            data={res.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span className={styles.monoBold}>{l.variantSku || l.variantId}</span> },
              { key: 'qty', header: 'Cant. Retenida', render: (l) => <span className={styles.textBold}>{l.quantity}</span> },
            ]}
          />
        </div>

        {res.notes && (
          <div className={styles.notesBox}>
            <span className={styles.notesLabel}>Notas:</span>
            <p className={styles.notesText}>{res.notes}</p>
          </div>
        )}

        <div className={styles.footer}>

          {res.status === 'ACTIVE' && (
            <ActionGuard action="manage" subject="Inventory">
              <div className={styles.actionStack}>

                <div className={styles.consumePanel}>
                  <h4 className={styles.consumeTitle}>¿Se concretó la venta?</h4>
                  <div className={styles.consumeRow}>
                    <div className={styles.consumeInput}>
                      <Input label="ID del Ticket de Venta (Opcional)" value={saleId} onChange={e => setSaleId(e.target.value)} placeholder="Ej: V-A1B2C3D4" />
                    </div>
                    <Button variant="primary" onClick={() => consumeMutation.mutate()} loading={consumeMutation.isPending} disabled={releaseMutation.isPending}>
                      Consumir Reserva
                    </Button>
                  </div>
                </div>

                <div className={styles.releaseRow}>
                  <Button variant="ghost" onClick={() => releaseMutation.mutate()} loading={releaseMutation.isPending} disabled={consumeMutation.isPending} className={styles.btnDangerGhost}>
                    Liberar Mercadería (Cancelar)
                  </Button>
                </div>
              </div>
            </ActionGuard>
          )}

          {res.status === 'CONSUMED' && (
            <div className={styles.alertBlueFull}>
              <CheckCircle size={20} />
              <span className={styles.alertText}>Reserva Concretada. La mercadería se vendió.</span>
            </div>
          )}

          {(res.status === 'RELEASED' || res.status === 'EXPIRED') && (
            <div className={styles.alertGrayFull}>
              <XCircle size={20} />
              <span className={styles.alertText}>Reserva Anulada o Vencida. Stock liberado.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
