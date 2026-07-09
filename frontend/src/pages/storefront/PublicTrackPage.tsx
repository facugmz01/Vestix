import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Navigation } from 'lucide-react';
import { shippingApi } from '@/api/shipping.api';
import { useTrackingSse } from '@/hooks/useTrackingSse';

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
    { enabled: !!token && data?.status === 'SHIPPED', onUpdate: () => refetch() },
  );

  const lat = liveData?.lastLatitude ?? data?.delivery?.lastLatitude;
  const lng = liveData?.lastLongitude ?? data?.delivery?.lastLongitude;

  if (isLoading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando seguimiento...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <Package size={48} color="#94a3b8" />
        <p>Código de seguimiento no válido</p>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[data.status] || data.status;
  const mapUrl = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 900 }}>Seguimiento de envío</h1>
        <p style={{ margin: 0, color: '#64748b' }}>Pedido #{data.orderRef}</p>
      </div>

      <div style={{
        padding: '16px 20px', borderRadius: '12px', marginBottom: '24px',
        background: data.status === 'DELIVERED' ? '#f0fdf4' : '#eff6ff',
        border: `1px solid ${data.status === 'DELIVERED' ? '#86efac' : '#93c5fd'}`,
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        {data.status === 'DELIVERED' ? <CheckCircle color="#22c55e" /> : <Truck color="#3b82f6" />}
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '18px' }}>{statusLabel}</p>
          {data.courierName && <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>{data.courierName}</p>}
        </div>
      </div>

      {mapUrl && data.status !== 'DELIVERED' && (
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ padding: '10px 16px', background: '#f8fafc', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={16} color="#8b5cf6" /> Ubicación en vivo
            {liveData?.lastLocationAt && (
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                {new Date(liveData.lastLocationAt).toLocaleTimeString()}
              </span>
            )}
          </div>
          <iframe title="Mapa" src={mapUrl} style={{ width: '100%', height: '240px', border: 'none' }} />
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>Historial</h3>
        {[
          { label: 'Pagado', date: data.timeline.paidAt },
          { label: 'Empaquetado', date: data.timeline.packedAt },
          { label: 'Despachado', date: data.timeline.dispatchedAt || data.timeline.shippedAt },
          { label: 'Entregado', date: data.timeline.deliveredAt },
        ].filter(e => e.date).map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>{e.label}</span>
            <span style={{ fontWeight: 600 }}>{new Date(e.date!).toLocaleString()}</span>
          </div>
        ))}
        {data.city && (
          <p style={{ margin: '16px 0 0', fontSize: '14px', color: '#64748b' }}>
            Destino: {data.city}{data.state ? `, ${data.state}` : ''} · {data.itemCount} artículos
          </p>
        )}
      </div>
    </div>
  );
}
