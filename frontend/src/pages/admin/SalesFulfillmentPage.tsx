import { SALES_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ShoppingBag, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

import {
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs, Modal, Input
} from '@/components/ui';

import { shippingApi, type FulfillmentListItem, type DispatchResult } from '@/api/shipping.api';
import { queryKeys } from '@/api/queryKeys';
import { useListPage } from '@/hooks/useListPage';

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'Pago pendiente',
  PAID: 'Pagado',
  PICKING: 'En preparación',
  PACKED: 'Empaquetado',
  SHIPPED: 'En tránsito',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_FILTERS = [
  { value: 'PAID', label: 'Por preparar (Pagados)' },
  { value: 'PACKED', label: 'Empaquetados' },
  { value: 'SHIPPED', label: 'En tránsito' },
  { value: 'DELIVERED', label: 'Entregados' },
  { value: 'PENDING_PAYMENT', label: 'Pago pendiente' },
];

export default function SalesFulfillmentPage() {
  const { page, pageSize, filters, setPage, setFilter } = useListPage({ status: 'PAID' }, { defaultPageSize: 20 });
  const queryClient = useQueryClient();

  const [dispatchModal, setDispatchModal] = useState<FulfillmentListItem | null>(null);
  const [completeModal, setCompleteModal] = useState<FulfillmentListItem | null>(null);
  const [linksModal, setLinksModal] = useState<DispatchResult | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [courierName, setCourierName] = useState('Propio');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [locationOrderId, setLocationOrderId] = useState<string | null>(null);

  const statusFilter = filters.status as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.orders.deliveries({ page, pageSize, status: statusFilter }),
    queryFn: () => shippingApi.listDeliveries({ page, pageSize, status: statusFilter }),
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: Parameters<typeof shippingApi.dispatch>[1] }) =>
      shippingApi.dispatch(orderId, dto),
    onSuccess: (result) => {
      toast.success('Pedido despachado');
      setDispatchModal(null);
      resetDispatchForm();
      setLinksModal(result);
      queryClient.invalidateQueries({ queryKey: ['shipping', 'deliveries'] });
    },
    onError: () => toast.error('Error al despachar el pedido'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ orderId, otpCode }: { orderId: string; otpCode: string }) =>
      shippingApi.completeDelivery(orderId, otpCode),
    onSuccess: () => {
      toast.success('Entrega confirmada');
      setCompleteModal(null);
      setOtp('');
      queryClient.invalidateQueries({ queryKey: ['shipping', 'deliveries'] });
    },
    onError: () => toast.error('Código incorrecto o pedido no válido'),
  });

  const locationMutation = useMutation({
    mutationFn: ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) =>
      shippingApi.updateLocation(orderId, lat, lng),
    onSuccess: () => {
      toast.success('Ubicación GPS actualizada');
      setLocationOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['shipping', 'deliveries'] });
    },
    onError: () => toast.error('No se pudo actualizar la ubicación'),
  });

  const resetDispatchForm = () => {
    setDriverName('');
    setDriverPhone('');
    setCourierName('Propio');
    setTrackingNumber('');
  };

  const fulfillments = data?.data ?? [];

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING_PAYMENT': return 'yellow';
      case 'PAID': return 'blue';
      case 'PICKING': return 'blue';
      case 'PACKED': return 'purple';
      case 'SHIPPED': return 'purple';
      case 'DELIVERED': return 'green';
      default: return 'gray';
    }
  };

  const handleUpdateGps = (orderId: string) => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en este navegador');
      return;
    }
    setLocationOrderId(orderId);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationMutation.mutate({
          orderId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        toast.error('No se pudo obtener la ubicación GPS');
        setLocationOrderId(null);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <PageContainer
      tabs={<Tabs items={SALES_TABS} />}
      title="Envíos y Despacho"
      subtitle="Gestioná pedidos web: preparación, despacho, tracking GPS y validación de entrega."
    >
      <FiltersBar actions={<Badge color="blue">{data?.total ?? 0} envíos</Badge>}>
        <select
          value={statusFilter}
          onChange={e => { setFilter('status', e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}
        >
          {STATUS_FILTERS.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : fulfillments.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={40} />}
            title="Sin pedidos en este estado"
            message={`No hay envíos con estado ${FULFILLMENT_STATUS_LABELS[statusFilter] || statusFilter}.`}
          />
        ) : (
          <Table
            keyField="id"
            data={fulfillments}
            columns={[
              {
                key: 'id',
                header: 'ID / Fecha',
                render: (f: FulfillmentListItem) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{f.saleOrderId.split('-')[0]}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(f.saleOrder.createdAt).toLocaleString()}
                    </div>
                  </div>
                ),
              },
              {
                key: 'customer',
                header: 'Cliente',
                render: (f: FulfillmentListItem) => f.saleOrder.customer?.fullName || 'Consumidor Final',
              },
              {
                key: 'shipping',
                header: 'Envío',
                render: (f: FulfillmentListItem) => (
                  <div>
                    <Badge color="blue">{f.saleOrder.shippingMethodName || 'Retiro'}</Badge>
                    {f.saleOrder.shippingAddress && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {f.saleOrder.shippingAddress.city}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (f: FulfillmentListItem) => (
                  <StatusChip
                    label={FULFILLMENT_STATUS_LABELS[f.status] || f.status}
                    color={getStatusColor(f.status) as any}
                  />
                ),
              },
              {
                key: 'tracking',
                header: 'Tracking',
                render: (f: FulfillmentListItem) => (
                  <div style={{ fontSize: '13px' }}>
                    {f.trackingNumber || '—'}
                    {f.delivery?.dispatchedAt && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Despachado: {new Date(f.delivery.dispatchedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (f: FulfillmentListItem) => (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['PAID', 'PICKING', 'PACKED'].includes(f.status) && (
                      <Button variant="primary" size="sm" onClick={() => setDispatchModal(f)}>
                        <Truck size={14} /> Despachar
                      </Button>
                    )}
                    {f.status === 'SHIPPED' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={locationOrderId === f.saleOrderId}
                          onClick={() => handleUpdateGps(f.saleOrderId)}
                        >
                          <Package size={14} /> GPS
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => setCompleteModal(f)}>
                          Validar entrega
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Section>

      {dispatchModal && (
        <Modal
          open
          title={`Despachar pedido ${dispatchModal.saleOrderId.split('-')[0]}`}
          onClose={() => { setDispatchModal(null); resetDispatchForm(); }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDispatchModal(null)}>Cancelar</Button>
              <Button
                variant="primary"
                loading={dispatchMutation.isPending}
                disabled={!driverName.trim()}
                onClick={() => dispatchMutation.mutate({
                  orderId: dispatchModal.saleOrderId,
                  dto: { driverName, driverPhone, courierName, trackingNumber },
                })}
              >
                Confirmar despacho
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input label="Repartidor *" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nombre del repartidor" />
            <Input label="Teléfono repartidor" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="54911..." />
            <Input label="Courier" value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="Propio / Andreani / etc." />
            <Input label="Número de tracking" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Opcional" />
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Al despachar se generará un código OTP de 6 dígitos que el cliente recibirá por WhatsApp para validar la entrega.
            </p>
          </div>
        </Modal>
      )}

      {completeModal && (
        <Modal
          open
          title="Validar entrega con OTP"
          onClose={() => { setCompleteModal(null); setOtp(''); }}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCompleteModal(null)}>Cancelar</Button>
              <Button
                variant="primary"
                loading={completeMutation.isPending}
                disabled={otp.length !== 6}
                onClick={() => completeMutation.mutate({ orderId: completeModal.saleOrderId, otpCode: otp })}
              >
                Confirmar entrega
              </Button>
            </>
          }
        >
          <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            Ingresá el código de 6 dígitos que se envió al cliente al despachar el pedido.
          </p>
          <Input
            label="Código OTP"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            style={{ fontFamily: 'monospace', letterSpacing: '4px' }}
          />
        </Modal>
      )}
      {linksModal && (
        <Modal
          open
          title="Envío despachado"
          onClose={() => setLinksModal(null)}
          footer={<Button variant="primary" onClick={() => setLinksModal(null)}>Cerrar</Button>}
        >
          <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            Compartí estos links con el cliente y el repartidor. OTP para validación: <strong style={{ fontFamily: 'monospace' }}>{linksModal.otpForAdmin}</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Seguimiento público</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input readOnly value={linksModal.links.trackingUrl} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px' }} />
                <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(linksModal.links.trackingUrl); toast.success('Copiado'); }}>Copiar</Button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>App repartidor</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <input readOnly value={linksModal.links.driverUrl} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '13px' }} />
                <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(linksModal.links.driverUrl); toast.success('Copiado'); }}>Copiar</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
