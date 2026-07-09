import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontOrdersApi } from '@/api/storefront-orders.api';
import { queryKeys } from '@/api/queryKeys';
import { StorefrontRequireAuth } from '@/components/storefront/StorefrontRequireAuth';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import { useTrackingSse } from '@/hooks/useTrackingSse';
import type { OrderTracking } from '@/api/shipping.api';

const FULFILLMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente de Pago', color: '#f59e0b' },
  PAID: { label: 'Pagado - Preparando', color: '#3b82f6' },
  PICKING: { label: 'En Preparación', color: '#3b82f6' },
  PACKED: { label: 'Empaquetado', color: '#6366f1' },
  READY_FOR_PICKUP: { label: 'Listo para Retiro', color: '#8b5cf6' },
  SHIPPED: { label: 'En Camino', color: '#8b5cf6' },
  DELIVERED: { label: 'Entregado', color: '#22c55e' },
  CANCELLED: { label: 'Cancelado', color: '#ef4444' },
  CONFIRMED: { label: 'Confirmado', color: '#3b82f6' },
  COMPLETED: { label: 'Confirmado', color: '#3b82f6' },
};

function getStatusDisplay(status: string) {
  const info = FULFILLMENT_STATUS_LABELS[status];
  if (info) {
    const icons: Record<string, typeof Clock> = {
      PENDING_PAYMENT: Clock,
      PAID: Package,
      PICKING: Package,
      PACKED: Package,
      READY_FOR_PICKUP: Package,
      SHIPPED: Truck,
      DELIVERED: CheckCircle,
      CONFIRMED: Package,
      COMPLETED: Package,
    };
    return { ...info, icon: icons[status] || Package };
  }
  return { label: status, color: '#64748b', icon: Package };
}

function MyOrdersContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.storefront.myOrders(),
    queryFn: () => storefrontOrdersApi.getMyOrders(1, 20),
  });

  const orders = data?.data || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '48px auto', padding: '0 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <div style={{ width: '400px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '28px', fontWeight: 900 }}>Mis Compras</h1>

        {isLoading ? (
          <div>Cargando historial...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '32px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Package size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, color: '#64748b' }}>Aún no has realizado compras.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map((o: any) => {
              const displayStatus = o.trackingStatus || o.status;
              const statusInfo = getStatusDisplay(displayStatus);
              const isSelected = selectedId === o.id;
              return (
                <div
                  key={o.id}
                  onClick={() => setSelectedId(o.id)}
                  style={{
                    padding: '20px',
                    background: isSelected ? '#eff6ff' : '#fff',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{formatSaleId(o.id, o.status)}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: statusInfo.color, fontWeight: 700, marginBottom: '12px' }}>
                    <statusInfo.icon size={16} /> {statusInfo.label}
                  </div>
                  {o.dispatchedAt && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      Despachado: {new Date(o.dispatchedAt).toLocaleString()}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{o.lines.length} artículos</span>
                    <span style={{ fontWeight: 900, color: '#0f172a' }}>{formatCurrency(o.grandTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', minHeight: '500px' }}>
        {!selectedId ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Package size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p>Seleccioná un pedido para ver los detalles.</p>
          </div>
        ) : (
          <OrderDetailView orderId={selectedId} />
        )}
      </div>
    </div>
  );
}

function OrderDetailView({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');

  const { data: tracking, isLoading } = useQuery({
    queryKey: queryKeys.storefront.tracking(orderId),
    queryFn: () => storefrontOrdersApi.getOrderTracking(orderId),
  });

  const { liveData, connected } = useTrackingSse(
    tracking?.status === 'SHIPPED' ? `/api/storefront/my-orders/${orderId}/tracking/live` : null,
    {
      enabled: tracking?.status === 'SHIPPED',
      onUpdate: () => queryClient.invalidateQueries({ queryKey: queryKeys.storefront.tracking(orderId) }),
    },
  );

  const confirmMutation = useMutation({
    mutationFn: (code: string) => storefrontOrdersApi.confirmDelivery(orderId, code),
    onSuccess: () => {
      toast.success('¡Entrega confirmada!');
      queryClient.invalidateQueries({ queryKey: queryKeys.storefront.tracking(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.storefront.myOrders() });
      setOtp('');
    },
    onError: () => toast.error('Código incorrecto o expirado'),
  });

  if (isLoading || !tracking) return <div>Cargando detalle...</div>;

  const statusInfo = getStatusDisplay(tracking.status);
  const progress = getTimelineProgress(tracking);

  const mapLat = liveData?.lastLatitude ?? tracking.delivery?.lastLatitude;
  const mapLng = liveData?.lastLongitude ?? tracking.delivery?.lastLongitude;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 900 }}>
            Pedido <span style={{ fontFamily: 'monospace' }}>{formatSaleId(tracking.orderId)}</span>
          </h2>
          {tracking.trackingNumber && (
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
              Tracking: <strong>{tracking.trackingNumber}</strong>
              {tracking.courierName && ` · ${tracking.courierName}`}
            </p>
          )}
        </div>
        <div style={{ padding: '8px 16px', background: '#f8fafc', border: `1px solid ${statusInfo.color}`, borderRadius: '999px', color: statusInfo.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <statusInfo.icon size={18} /> {statusInfo.label}
        </div>
      </div>

      <Timeline tracking={tracking} progress={progress} />

      {mapLat && mapLng && (
        <DeliveryMap
          lat={mapLat}
          lng={mapLng}
          updatedAt={liveData?.lastLocationAt || tracking.delivery?.lastLocationAt}
          driverName={tracking.delivery?.driverName}
          live={connected}
        />
      )}

      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>Artículos</h3>
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '32px' }}>
        {tracking.lines.map((l: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < tracking.lines.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{l.productName || l.variantId}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Cant: {l.quantity}</p>
            </div>
            <span style={{ fontWeight: 800 }}>{formatCurrency(l.finalPrice)}</span>
          </div>
        ))}
        <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '16px', fontWeight: 800 }}>Total</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{formatCurrency(tracking.grandTotal)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Información de Envío</h4>
          {tracking.shippingAddress ? (
            <>
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{tracking.shippingAddress.fullName}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                {tracking.shippingAddress.address}<br />
                {tracking.shippingAddress.city}, {tracking.shippingAddress.state}<br />
                CP: {tracking.shippingAddress.zipCode}
              </p>
              {tracking.shippingMethodName && (
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Método: {tracking.shippingMethodName}
                </p>
              )}
            </>
          ) : (
            <p style={{ margin: 0, color: '#64748b' }}>Retiro en tienda</p>
          )}
        </div>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Fechas</h4>
          <DeliveryDates timeline={tracking.timeline} />
        </div>
      </div>

      {tracking.status === 'SHIPPED' && tracking.delivery?.hasDeliveryCode && (
        <div style={{ padding: '20px', border: '2px solid #8b5cf6', borderRadius: '12px', background: '#faf5ff' }}>
          <h4 style={{ margin: '0 0 8px', fontWeight: 800 }}>Confirmar recepción</h4>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>
            Ingresá el código de 6 dígitos que recibiste por WhatsApp al despachar tu pedido.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              className="storefront-input"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ maxWidth: '140px', fontFamily: 'monospace', fontSize: '18px', letterSpacing: '4px' }}
            />
            <button
              className="storefront-btn"
              disabled={otp.length !== 6 || confirmMutation.isPending}
              onClick={() => confirmMutation.mutate(otp)}
            >
              Confirmar entrega
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Timeline({ tracking, progress }: { tracking: OrderTracking; progress: number }) {
  const steps = [
    { label: 'Pago', active: !!tracking.timeline.paidAt || ['PAID', 'PICKING', 'PACKED', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED'].includes(tracking.status) },
    { label: 'Preparación', active: !!tracking.timeline.packedAt || ['PACKED', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED'].includes(tracking.status) },
    { label: 'Despachado', active: !!tracking.timeline.dispatchedAt || tracking.status === 'SHIPPED' || tracking.status === 'DELIVERED' },
    { label: 'Entregado', active: tracking.status === 'DELIVERED' },
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', height: '4px', background: '#e2e8f0', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '16px', left: '0', width: `${progress}%`, height: '4px', background: '#3b82f6', zIndex: 0, transition: 'all 0.5s' }} />
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '80px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step.active ? '#3b82f6' : '#f1f5f9', border: step.active ? 'none' : '4px solid #fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {step.active && <CheckCircle size={18} />}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: step.active ? '#0f172a' : '#94a3b8', marginTop: '8px', textAlign: 'center' }}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

function DeliveryMap({ lat, lng, updatedAt, driverName, live }: { lat: number; lng: number; updatedAt?: string; driverName?: string; live?: boolean }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div style={{ marginBottom: '32px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Navigation size={16} color="#8b5cf6" />
        <span style={{ fontWeight: 700, fontSize: '14px' }}>
          Ubicación del repartidor{driverName ? `: ${driverName}` : ''}
          {live && <span style={{ marginLeft: '8px', color: '#22c55e', fontSize: '12px' }}>● En vivo</span>}
        </span>
        {updatedAt && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>
            Actualizado: {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
      <iframe
        title="Ubicación del delivery"
        src={mapUrl}
        style={{ width: '100%', height: '220px', border: 'none' }}
        loading="lazy"
      />
      <div style={{ padding: '8px 16px', fontSize: '12px' }}>
        <a href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={14} /> Abrir en Google Maps
        </a>
      </div>
    </div>
  );
}

function DeliveryDates({ timeline }: { timeline: OrderTracking['timeline'] }) {
  const entries = [
    { label: 'Pagado', date: timeline.paidAt },
    { label: 'Empaquetado', date: timeline.packedAt },
    { label: 'Despachado', date: timeline.dispatchedAt || timeline.shippedAt },
    { label: 'Entregado', date: timeline.deliveredAt },
  ].filter(e => e.date);

  if (entries.length === 0) {
    return <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Sin fechas registradas aún.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
          <span style={{ color: '#64748b' }}>{e.label}</span>
          <span style={{ fontWeight: 600 }}>{new Date(e.date!).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function getTimelineProgress(tracking: OrderTracking): number {
  if (tracking.status === 'DELIVERED') return 100;
  if (tracking.status === 'SHIPPED') return 66;
  if (['PACKED', 'READY_FOR_PICKUP', 'PICKING', 'PAID'].includes(tracking.status)) return 33;
  return 0;
}

export default function StorefrontMyOrdersPage() {
  return (
    <StorefrontRequireAuth requireCompleteProfile>
      <MyOrdersContent />
    </StorefrontRequireAuth>
  );
}
