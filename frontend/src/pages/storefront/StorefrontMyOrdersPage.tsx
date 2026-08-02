import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock, MapPin, Navigation, XCircle, CreditCard } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { storefrontOrdersApi } from '@/api/storefront-orders.api';
import { storefrontApi } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { StorefrontRequireAuth } from '@/components/storefront/StorefrontRequireAuth';
import { BankTransferDetails, hasBankTransferDetails } from '@/components/storefront';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import { storePrefix } from '@/utils/storefrontDomain';
import { useTrackingSse } from '@/hooks/useTrackingSse';
import type { OrderTracking, OrderLineItem } from '@/api/shipping.api';
import styles from './StorefrontMyOrdersPage.module.css';

function useCssVar<T extends HTMLElement>(varName: string, value: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    ref.current?.style.setProperty(varName, value);
  }, [varName, value]);
  return ref;
}

function StatusRow({ statusInfo }: { statusInfo: ReturnType<typeof getStatusDisplay> }) {
  const ref = useCssVar<HTMLDivElement>('--status-color', statusInfo.color);
  const Icon = statusInfo.icon;
  return (
    <div ref={ref} className={clsx(styles.statusRow, styles.statusRowDynamic)}>
      <Icon size={16} /> {statusInfo.label}
    </div>
  );
}

function StatusBadge({ statusInfo }: { statusInfo: ReturnType<typeof getStatusDisplay> }) {
  const ref = useCssVar<HTMLDivElement>('--status-color', statusInfo.color);
  const Icon = statusInfo.icon;
  return (
    <div ref={ref} className={clsx(styles.statusBadge, styles.statusBadgeDynamic)}>
      <Icon size={18} /> {statusInfo.label}
    </div>
  );
}

function TimelineProgressBar({ progress, variant = 'default' }: { progress: number; variant?: 'default' | 'cancelled' }) {
  const ref = useCssVar<HTMLDivElement>('--progress-pct', `${progress}%`);
  return (
    <div
      ref={ref}
      className={clsx(
        styles.timelineProgress,
        styles.timelineProgressDynamic,
        variant === 'cancelled' && styles.timelineProgressCancelled,
      )}
    />
  );
}

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
      CANCELLED: XCircle,
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

  useEffect(() => {
    if (!selectedId && orders.length > 0) {
      setSelectedId(orders[0].id);
    }
  }, [orders, selectedId]);

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
                  <StatusRow statusInfo={statusInfo} />
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
          <OrderDetailView
            orderId={selectedId}
            paymentMethod={orders.find((o: any) => o.id === selectedId)?.paymentMethod}
            grandTotal={orders.find((o: any) => o.id === selectedId)?.grandTotal}
          />
        )}
      </div>
    </div>
  );
}

function OrderDetailView({
  orderId,
  paymentMethod,
  grandTotal,
}: {
  orderId: string;
  paymentMethod?: string;
  grandTotal?: number;
}) {
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');
  const prefix = storePrefix();

  const { data: tracking, isLoading } = useQuery({
    queryKey: queryKeys.storefront.tracking(orderId),
    queryFn: () => storefrontOrdersApi.getOrderTracking(orderId),
  });

  const { data: settings } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
    enabled: paymentMethod === 'BANK_TRANSFER',
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
  const isCancelled = tracking.status === 'CANCELLED';
  const showBankTransfer =
    paymentMethod === 'BANK_TRANSFER' &&
    tracking.status === 'PENDING_PAYMENT' &&
    hasBankTransferDetails(settings);

  const driverLat = liveData?.lastLatitude ?? tracking.delivery?.lastLatitude;
  const driverLng = liveData?.lastLongitude ?? tracking.delivery?.lastLongitude;
  const destLat = tracking.shippingAddress?.latitude;
  const destLng = tracking.shippingAddress?.longitude;
  const hasDriverLocation = driverLat != null && driverLng != null;
  const hasDestination = destLat != null && destLng != null;
  const showMap =
    tracking.showMapToCustomer !== false &&
    tracking.status === 'SHIPPED' &&
    (hasDriverLocation || hasDestination);
  const mapLat = hasDriverLocation ? driverLat! : destLat!;
  const mapLng = hasDriverLocation ? driverLng! : destLng!;
  const mapMode = hasDriverLocation ? 'driver' : 'destination';

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
        <StatusBadge statusInfo={statusInfo} />
      </div>

      {isCancelled && (
        <div className={styles.cancelledBanner}>
          <XCircle size={20} />
          <div>
            <p className={styles.cancelledTitle}>Pedido cancelado</p>
            <p className={styles.cancelledText}>
              {tracking.timeline.paidAt
                ? 'El pago fue registrado. Si corresponde un reembolso, te contactaremos.'
                : 'Este pedido fue cancelado antes de completar el pago.'}
            </p>
          </div>
        </div>
      )}

      <OrderTimeline tracking={tracking} />

      {showBankTransfer && settings && (
        <BankTransferDetails
          info={settings}
          amount={grandTotal ?? tracking.grandTotal}
          formatAmount={formatCurrency}
        />
      )}

      {showMap && (
        <DeliveryMap
          lat={mapLat}
          lng={mapLng}
          mode={mapMode}
          updatedAt={liveData?.lastLocationAt || tracking.delivery?.lastLocationAt}
          driverName={tracking.delivery?.driverName}
          live={connected && mapMode === 'driver'}
        />
      )}

      <h3 className={styles.sectionTitle}>Artículos</h3>
      <div className={styles.linesBox}>
        {tracking.lines.map((line: OrderLineItem) => (
          <OrderLineRow key={line.id} line={line} />
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
          <DeliveryDates tracking={tracking} />
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

function OrderLineRow({ line }: { line: OrderLineItem }) {
  const meta: string[] = [];
  if (line.variantSku) meta.push(`SKU: ${line.variantSku}`);
  if (line.size) meta.push(`Talle: ${line.size}`);

  return (
    <div className={styles.lineRow}>
      <div className={styles.lineInfo}>
        <p className={styles.lineName}>{line.productName}</p>
        {meta.length > 0 && <p className={styles.lineMeta}>{meta.join(' · ')}</p>}
        <p className={styles.lineQty}>Cantidad: {line.quantity}</p>
      </div>
      <span className={styles.linePrice}>{formatCurrency(line.finalPrice)}</span>
    </div>
  );
}

interface TimelineStep {
  label: string;
  state: 'completed' | 'active' | 'pending' | 'cancelled';
  icon: typeof CheckCircle;
}

function buildTimelineSteps(tracking: OrderTracking): TimelineStep[] {
  const { timeline, status } = tracking;
  const isCancelled = status === 'CANCELLED';
  const isPendingPayment = status === 'PENDING_PAYMENT';

  if (isPendingPayment) {
    return [
      { label: 'Pago', state: 'active', icon: CreditCard },
      { label: 'Preparación', state: 'pending', icon: Package },
      { label: 'Despachado', state: 'pending', icon: Truck },
      { label: 'Entregado', state: 'pending', icon: CheckCircle },
    ];
  }

  const milestones = [
    { label: 'Pago', done: !!timeline.paidAt, icon: CreditCard },
    { label: 'Preparación', done: !!timeline.packedAt || !!timeline.pickedAt, icon: Package },
    { label: 'Despachado', done: !!timeline.dispatchedAt || !!timeline.shippedAt, icon: Truck },
    { label: 'Entregado', done: status === 'DELIVERED', icon: CheckCircle },
  ];

  if (!isCancelled) {
    let foundActive = false;
    return milestones.map(m => {
      if (m.done) return { label: m.label, state: 'completed' as const, icon: m.icon };
      if (!foundActive) {
        foundActive = true;
        return { label: m.label, state: 'active' as const, icon: m.icon };
      }
      return { label: m.label, state: 'pending' as const, icon: m.icon };
    });
  }

  const completed = milestones
    .filter(m => m.done)
    .map(m => ({ label: m.label, state: 'completed' as const, icon: m.icon }));

  return [...completed, { label: 'Cancelado', state: 'cancelled' as const, icon: XCircle }];
}

function getTimelineProgress(steps: TimelineStep[]): number {
  if (steps.length <= 1) return 0;
  const lastFilled = steps.reduce(
    (last, step, i) => (step.state === 'completed' || step.state === 'cancelled' ? i : last),
    -1,
  );
  if (lastFilled < 0) {
    const activeIdx = steps.findIndex(s => s.state === 'active');
    return activeIdx >= 0 ? (activeIdx / (steps.length - 1)) * 100 : 0;
  }
  return (lastFilled / (steps.length - 1)) * 100;
}

function OrderTimeline({ tracking }: { tracking: OrderTracking }) {
  const steps = buildTimelineSteps(tracking);
  const progress = getTimelineProgress(steps);
  const isCancelled = tracking.status === 'CANCELLED';

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineTrack} />
      <TimelineProgressBar progress={progress} variant={isCancelled ? 'cancelled' : 'default'} />
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className={styles.timelineStep}>
            <div
              className={clsx(
                styles.timelineCircle,
                step.state === 'completed' && styles.timelineCircleActive,
                step.state === 'active' && styles.timelineCircleCurrent,
                step.state === 'cancelled' && styles.timelineCircleCancelled,
              )}
            >
              {(step.state === 'completed' || step.state === 'cancelled') && <Icon size={18} />}
              {step.state === 'active' && <Icon size={18} />}
            </div>
            <span
              className={clsx(
                styles.timelineLabel,
                (step.state === 'completed' || step.state === 'active') && styles.timelineLabelActive,
                step.state === 'cancelled' && styles.timelineLabelCancelled,
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DeliveryMap({
  lat,
  lng,
  updatedAt,
  driverName,
  live,
  mode = 'driver',
}: {
  lat: number;
  lng: number;
  updatedAt?: string;
  driverName?: string;
  live?: boolean;
  mode?: 'driver' | 'destination';
}) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  const title =
    mode === 'destination'
      ? 'Destino de entrega'
      : `Ubicación del repartidor${driverName ? `: ${driverName}` : ''}`;

  return (
    <div className={styles.mapWrap}>
      <div className={styles.mapHeader}>
        <Navigation size={16} color="var(--purple, #8b5cf6)" />
        <span className={styles.mapTitle}>
          {title}
          {live && <span className={styles.mapLive}>● En vivo</span>}
        </span>
        {updatedAt && mode === 'driver' && (
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

function DeliveryDates({ tracking }: { tracking: OrderTracking }) {
  const { timeline, status } = tracking;

  const entries = [
    { label: 'Pagado', date: timeline.paidAt },
    { label: 'Empaquetado', date: timeline.packedAt },
    { label: 'Despachado', date: timeline.dispatchedAt || timeline.shippedAt },
    { label: 'Entregado', date: timeline.deliveredAt },
    { label: 'Cancelado', date: status === 'CANCELLED' ? timeline.cancelledAt : undefined },
  ].filter(e => e.date);

  if (entries.length === 0) {
    return <p className={styles.dateEmpty}>Sin fechas registradas aún.</p>;
  }

  return (
    <div className={styles.dateList}>
      {entries.map((e, i) => (
        <div key={i} className={clsx(styles.dateRow, e.label === 'Cancelado' && styles.dateRowCancelled)}>
          <span className={styles.dateLabel}>{e.label}</span>
          <span className={styles.dateValue}>{new Date(e.date!).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function StorefrontMyOrdersPage() {
  return (
    <StorefrontRequireAuth requireCompleteProfile>
      <MyOrdersContent />
    </StorefrontRequireAuth>
  );
}
