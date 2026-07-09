import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Navigation } from 'lucide-react';
import { shippingApi } from '@/api/shipping.api';
import { useTrackingSse } from '@/hooks/useTrackingSse';
import styles from './PublicTrackPage.module.css';

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID: 'Pagado',
  PICKING: 'En preparación',
  PACKED: 'Empaquetado',
  READY_FOR_PICKUP: 'Listo para retiro',
  SHIPPED: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  IN_TRANSIT: 'En tránsito',
  ARRIVED: 'Llegó al destino',
};

export default function PublicTrackPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['track', token],
    queryFn: () => shippingApi.getPublicTracking(token!),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { liveData } = useTrackingSse(
    token ? `/api/track/${token}/live` : null,
    {
      enabled: !!token && data?.status === 'SHIPPED',
      onUpdate: () => refetch(),
    },
  );

  const lat = liveData?.lastLatitude ?? data?.delivery?.lastLatitude;
  const lng = liveData?.lastLongitude ?? data?.delivery?.lastLongitude;

  if (isLoading) {
    return <div className={styles.centered}>Cargando seguimiento...</div>;
  }

  if (error || !data) {
    return (
      <div className={styles.centered}>
        <Package size={48} color="var(--text-muted)" />
        <p>Código de seguimiento no válido</p>
      </div>
    );
  }

  const deliveryStatus = data.delivery?.status || data.deliveryStatus;
  const statusLabel =
    (deliveryStatus === 'ARRIVED' && data.status === 'SHIPPED'
      ? STATUS_LABELS.ARRIVED
      : STATUS_LABELS[data.status]) || data.status;
  const mapUrl = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Seguimiento de envío</h1>
        <p className={styles.subtitle}>Pedido #{data.orderRef}</p>
      </div>

      <div className={`${styles.statusCard} ${data.status === 'DELIVERED' ? styles.statusDelivered : styles.statusInTransit}`}>
        {data.status === 'DELIVERED' ? <CheckCircle color="var(--green)" /> : <Truck color="var(--blue)" />}
        <div>
          <p className={styles.statusLabel}>{statusLabel}</p>
          {data.courierName && <p className={styles.statusMeta}>{data.courierName}</p>}
        </div>
      </div>

      {mapUrl && data.status !== 'DELIVERED' && (
        <div className={styles.card}>
          <div className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Navigation size={16} color="var(--purple)" /> Ubicación en vivo
            {liveData?.lastLocationAt && (
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                {new Date(liveData.lastLocationAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <iframe title="Mapa de seguimiento" src={mapUrl} className={styles.map} />
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Historial</h3>
        {[
          { label: 'Pagado', date: data.timeline.paidAt },
          { label: 'Empaquetado', date: data.timeline.packedAt },
          { label: 'Despachado', date: data.timeline.dispatchedAt || data.timeline.shippedAt },
          { label: 'Entregado', date: data.timeline.deliveredAt },
        ].filter(e => e.date).map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{e.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(e.date!).toLocaleString()}</span>
          </div>
        ))}
        {data.city && (
          <p style={{ margin: '16px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Destino: {data.city}{data.state ? `, ${data.state}` : ''} · {data.itemCount} artículos
          </p>
        )}
      </div>
    </div>
  );
}
