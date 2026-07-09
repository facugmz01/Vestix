import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock, MapPin, Navigation } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { storefrontOrdersApi } from '@/api/storefront-orders.api';
import { queryKeys } from '@/api/queryKeys';
import { StorefrontRequireAuth } from '@/components/storefront/StorefrontRequireAuth';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import { useTrackingSse } from '@/hooks/useTrackingSse';
import type { OrderTracking } from '@/api/shipping.api';
import styles from './StorefrontMyOrdersPage.module.css';

const FULFILLMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'Pendiente de Pago', color: 'var(--amber, #f59e0b)' },
  PAID: { label: 'Pagado - Preparando', color: 'var(--sf-primary, var(--accent))' },
  PICKING: { label: 'En Preparación', color: 'var(--sf-primary, var(--accent))' },
  PACKED: { label: 'Empaquetado', color: 'var(--purple, #6366f1)' },
  READY_FOR_PICKUP: { label: 'Listo para Retiro', color: 'var(--purple, #8b5cf6)' },
  SHIPPED: { label: 'En Camino', color: 'var(--purple, #8b5cf6)' },
  DELIVERED: { label: 'Entregado', color: 'var(--green)' },
  CANCELLED: { label: 'Cancelado', color: 'var(--red)' },
  CONFIRMED: { label: 'Confirmado', color: 'var(--sf-primary, var(--accent))' },
  COMPLETED: { label: 'Confirmado', color: 'var(--sf-primary, var(--accent))' },
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
  return { label: status, color: 'var(--text-secondary)', icon: Package };
}

function MyOrdersContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.storefront.myOrders(),
    queryFn: () => storefrontOrdersApi.getMyOrders(1, 20),
  });

  const orders = data?.data || [];

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <h1 className={styles.title}>Mis Compras</h1>

        {isLoading ? (
          <div className={styles.loading}>Cargando historial...</div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyCard}>
            <Package size={32} className={styles.emptyIcon} />
            <p className={styles.emptyText}>Aún no has realizado compras.</p>
          </div>
        ) : (
          <div className={styles.orderList}>
            {orders.map((o: any) => {
              const displayStatus = o.trackingStatus || o.status;
              const statusInfo = getStatusDisplay(displayStatus);
              const isSelected = selectedId === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className={clsx(styles.orderCard, isSelected && styles.orderCardSelected)}
                >
                  <div className={styles.orderHeader}>
                    <span className={styles.orderId}>{formatSaleId(o.id, o.status)}</span>
                    <span className={styles.orderDate}>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.statusRow} style={{ color: statusInfo.color }}>
                    <statusInfo.icon size={16} /> {statusInfo.label}
                  </div>
                  {o.dispatchedAt && (
                    <div className={styles.dispatched}>
                      Despachado: {new Date(o.dispatchedAt).toLocaleString()}
                    </div>
                  )}
                  <div className={styles.orderFooter}>
                    <span className={styles.itemCount}>{o.lines.length} artículos</span>
                    <span className={styles.orderTotal}>{formatCurrency(o.grandTotal)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.detailPanel}>
        {!selectedId ? (
          <div className={styles.placeholder}>
            <Package size={48} className={styles.placeholderIcon} />
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

  if (isLoading || !tracking) return <div className={styles.loading}>Cargando detalle...</div>;

  const statusInfo = getStatusDisplay(tracking.status);
  const progress = getTimelineProgress(tracking);

  const mapLat = liveData?.lastLatitude ?? tracking.delivery?.lastLatitude;
  const mapLng = liveData?.lastLongitude ?? tracking.delivery?.lastLongitude;

  return (
    <div>
      <div className={styles.detailHeader}>
        <div>
          <h2 className={styles.detailTitle}>
            Pedido <span className={styles.mono}>{formatSaleId(tracking.orderId)}</span>
          </h2>
          {tracking.trackingNumber && (
            <p className={styles.trackingMeta}>
              Tracking: <strong>{tracking.trackingNumber}</strong>
              {tracking.courierName && ` · ${tracking.courierName}`}
            </p>
          )}
        </div>
        <div className={styles.statusBadge} style={{ borderColor: statusInfo.color, color: statusInfo.color }}>
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

      <h3 className={styles.sectionTitle}>Artículos</h3>
      <div className={styles.linesBox}>
        {tracking.lines.map((l: any, i: number) => (
          <div key={i} className={styles.lineRow}>
            <div>
              <p className={styles.lineName}>{l.productName || l.variantId}</p>
              <p className={styles.lineQty}>Cant: {l.quantity}</p>
            </div>
            <span className={styles.linePrice}>{formatCurrency(l.finalPrice)}</span>
          </div>
        ))}
        <div className={styles.linesTotal}>
          <span className={styles.linesTotalLabel}>Total</span>
          <span className={styles.linesTotalValue}>{formatCurrency(tracking.grandTotal)}</span>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h4 className={styles.infoCardTitle}>Información de Envío</h4>
          {tracking.shippingAddress ? (
            <>
              <p className={styles.infoName}>{tracking.shippingAddress.fullName}</p>
              <p className={styles.infoText}>
                {tracking.shippingAddress.address}<br />
                {tracking.shippingAddress.city}, {tracking.shippingAddress.state}<br />
                CP: {tracking.shippingAddress.zipCode}
              </p>
              {tracking.shippingMethodName && (
                <p className={styles.infoMuted}>Método: {tracking.shippingMethodName}</p>
              )}
            </>
          ) : (
            <p className={styles.infoEmpty}>Retiro en tienda</p>
          )}
        </div>
        <div className={styles.infoCard}>
          <h4 className={styles.infoCardTitle}>Fechas</h4>
          <DeliveryDates timeline={tracking.timeline} />
        </div>
      </div>

      {tracking.status === 'SHIPPED' && tracking.delivery?.hasDeliveryCode && (
        <div className={styles.confirmBox}>
          <h4 className={styles.confirmTitle}>Confirmar recepción</h4>
          <p className={styles.confirmText}>
            Ingresá el código de 6 dígitos que recibiste por WhatsApp al despachar tu pedido.
          </p>
          <div className={styles.confirmRow}>
            <input
              className={clsx('storefront-input', styles.otpInput)}
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
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
    <div className={styles.timeline}>
      <div className={styles.timelineTrack} />
      <div className={styles.timelineProgress} style={{ width: `${progress}%` }} />
      {steps.map((step, i) => (
        <div key={i} className={styles.timelineStep}>
          <div className={clsx(styles.timelineCircle, step.active && styles.timelineCircleActive)}>
            {step.active && <CheckCircle size={18} />}
          </div>
          <span className={clsx(styles.timelineLabel, step.active && styles.timelineLabelActive)}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

function DeliveryMap({ lat, lng, updatedAt, driverName, live }: { lat: number; lng: number; updatedAt?: string; driverName?: string; live?: boolean }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className={styles.mapWrap}>
      <div className={styles.mapHeader}>
        <Navigation size={16} color="var(--purple, #8b5cf6)" />
        <span className={styles.mapTitle}>
          Ubicación del repartidor{driverName ? `: ${driverName}` : ''}
          {live && <span className={styles.mapLive}>● En vivo</span>}
        </span>
        {updatedAt && (
          <span className={styles.mapUpdated}>
            Actualizado: {new Date(updatedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
      <iframe
        title="Ubicación del delivery"
        src={mapUrl}
        className={styles.mapFrame}
        loading="lazy"
      />
      <div className={styles.mapFooter}>
        <a href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer" className={styles.mapLink}>
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
    return <p className={styles.dateEmpty}>Sin fechas registradas aún.</p>;
  }

  return (
    <div className={styles.dateList}>
      {entries.map((e, i) => (
        <div key={i} className={styles.dateRow}>
          <span className={styles.dateLabel}>{e.label}</span>
          <span className={styles.dateValue}>{new Date(e.date!).toLocaleString()}</span>
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
