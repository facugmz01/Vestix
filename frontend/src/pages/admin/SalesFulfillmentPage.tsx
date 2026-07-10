import { DELIVERY_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, PackageCheck, CheckCircle, ShoppingBag, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

import {
  PageContainer, Section, Table, Button, Badge, FiltersBar, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs, Modal, Input
} from '@/components/ui';

import { shippingApi, type FulfillmentListItem, type DispatchResult } from '@/api/shipping.api';
import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import { useListPage } from '@/hooks/useListPage';
import { formatSaleId } from '@/utils/formatId';
import adminStyles from '@/styles/AdminListShared.module.css';
import detailStyles from '@/styles/DetailDrawerShared.module.css';
import pageStyles from './SalesFulfillmentPage.module.css';

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

function isHomeDelivery(f: FulfillmentListItem) {
  return !!f.saleOrder.shippingAddress;
}

export default function SalesFulfillmentPage() {
  const { page, pageSize, filters, setPage, setFilter } = useListPage({ status: 'PAID' }, { defaultPageSize: 20 });
  const queryClient = useQueryClient();

  const [dispatchModal, setDispatchModal] = useState<FulfillmentListItem | null>(null);
  const [completeModal, setCompleteModal] = useState<FulfillmentListItem | null>(null);
  const [linksModal, setLinksModal] = useState<DispatchResult | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [courierName, setCourierName] = useState('Propio');
  const [carrierType, setCarrierType] = useState<'PROPIO' | 'ANDREANI' | 'MERCADO_ENVIOS'>('PROPIO');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [locationOrderId, setLocationOrderId] = useState<string | null>(null);

  const statusFilter = filters.status as string;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.orders.deliveries({ page, pageSize, status: statusFilter }),
    queryFn: () => shippingApi.listDeliveries({ page, pageSize, status: statusFilter }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shipping', 'deliveries'] });

  const dispatchMutation = useMutation({
    mutationFn: ({ orderId, dto }: { orderId: string; dto: Parameters<typeof shippingApi.dispatch>[1] }) =>
      shippingApi.dispatch(orderId, dto),
    onSuccess: (result) => {
      toast.success('Pedido despachado');
      setDispatchModal(null);
      resetDispatchForm();
      setLinksModal(result);
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || 'Error al despachar el pedido'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ orderId, otpCode }: { orderId: string; otpCode: string }) =>
      shippingApi.completeDelivery(orderId, otpCode),
    onSuccess: () => {
      toast.success('Entrega confirmada');
      setCompleteModal(null);
      setOtp('');
      invalidate();
    },
    onError: () => toast.error('Código incorrecto o pedido no válido'),
  });

  const completeManualMutation = useMutation({
    mutationFn: (orderId: string) => shippingApi.completeManual(orderId, 'Completado manualmente desde backoffice'),
    onSuccess: () => {
      toast.success('Entrega marcada como completada');
      setCompleteModal(null);
      setOtp('');
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || 'No se pudo completar la entrega'),
  });

  const pickupStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      salesApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('Estado actualizado');
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || 'Error al actualizar estado'),
  });

  const locationMutation = useMutation({
    mutationFn: ({ orderId, lat, lng }: { orderId: string; lat: number; lng: number }) =>
      shippingApi.updateLocation(orderId, lat, lng),
    onSuccess: () => {
      toast.success('Ubicación GPS actualizada');
      setLocationOrderId(null);
      invalidate();
    },
    onError: () => toast.error('No se pudo actualizar la ubicación'),
  });

  const resetDispatchForm = () => {
    setDriverName('');
    setDriverPhone('');
    setCourierName('Propio');
    setCarrierType('PROPIO');
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
      tabs={<Tabs items={DELIVERY_TABS} />}
      title="Envíos y Despacho"
      subtitle="Gestioná pedidos web: preparación, despacho, tracking GPS y validación de entrega."
    >
      <FiltersBar actions={<Badge color="blue">{data?.total ?? 0} envíos</Badge>}>
        <select
          value={statusFilter}
          onChange={e => { setFilter('status', e.target.value); setPage(1); }}
          className={adminStyles.filterSelect}
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
                    <div className={adminStyles.cellPrimary}>{formatSaleId(f.saleOrderId)}</div>
                    <div className={adminStyles.cellMuted}>
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
                    <Badge color={isHomeDelivery(f) ? 'blue' : 'gray'}>
                      {isHomeDelivery(f)
                        ? (f.saleOrder.shippingMethodName || 'Envío a domicilio')
                        : (f.saleOrder.shippingMethodName || 'Retiro en tienda')}
                    </Badge>
                    {f.saleOrder.shippingAddress && (
                      <div className={adminStyles.cellMutedTiny}>
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
                    label={
                      !isHomeDelivery(f) && f.saleOrder.status === 'READY_FOR_PICKUP'
                        ? 'Listo para retiro'
                        : (FULFILLMENT_STATUS_LABELS[f.status] || f.status)
                    }
                    color={getStatusColor(f.status) as any}
                  />
                ),
              },
              {
                key: 'tracking',
                header: 'Tracking',
                render: (f: FulfillmentListItem) => (
                  <div className={adminStyles.cellDate}>
                    {f.trackingNumber || '—'}
                    {f.delivery?.dispatchedAt && (
                      <div className={adminStyles.cellMutedXs}>
                        Despachado: {new Date(f.delivery.dispatchedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (f: FulfillmentListItem) => {
                  const home = isHomeDelivery(f);
                  return (
                  <div className={adminStyles.rowActionsWrap}>
                    {home && ['PAID', 'PICKING', 'PACKED'].includes(f.status) && (
                      <Button variant="primary" size="sm" onClick={() => setDispatchModal(f)}>
                        <Truck size={14} /> Despachar
                      </Button>
                    )}
                    {!home && ['PAID', 'PICKING', 'PACKED'].includes(f.status) && f.saleOrder.status !== 'READY_FOR_PICKUP' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={pickupStatusMutation.isPending}
                        onClick={() => pickupStatusMutation.mutate({ orderId: f.saleOrderId, status: 'READY_FOR_PICKUP' })}
                      >
                        <PackageCheck size={14} /> Listo p/retiro
                      </Button>
                    )}
                    {!home && f.saleOrder.status === 'READY_FOR_PICKUP' && f.status !== 'DELIVERED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={pickupStatusMutation.isPending}
                        onClick={() => pickupStatusMutation.mutate({ orderId: f.saleOrderId, status: 'DELIVERED' })}
                      >
                        <CheckCircle size={14} /> Entregado
                      </Button>
                    )}
                    {home && f.status === 'SHIPPED' && (
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
                  );
                },
              },
            ]}
          />
        )}
      </Section>

      {dispatchModal && (
        <Modal
          open
          title={`Despachar pedido ${formatSaleId(dispatchModal.saleOrderId)}`}
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
                  dto: { driverName, driverPhone, courierName, trackingNumber, carrierType },
                })}
              >
                Confirmar despacho
              </Button>
            </>
          }
        >
          <div className={pageStyles.modalStack}>
            {dispatchModal.saleOrder.shippingAddress && (
              <div className={pageStyles.infoBox}>
                <strong>{dispatchModal.saleOrder.shippingAddress.fullName}</strong>
                <div>{dispatchModal.saleOrder.shippingAddress.address}</div>
                <div>
                  {dispatchModal.saleOrder.shippingAddress.city}, {dispatchModal.saleOrder.shippingAddress.state}
                  {dispatchModal.saleOrder.shippingAddress.zipCode ? ` · CP ${dispatchModal.saleOrder.shippingAddress.zipCode}` : ''}
                </div>
              </div>
            )}
            <Input label="Repartidor *" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nombre del repartidor" />
            <Input label="Teléfono repartidor" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="54911..." />
            <div>
              <label className={pageStyles.formLabel} htmlFor="carrier-type">Carrier</label>
              <select
                id="carrier-type"
                value={carrierType}
                onChange={e => {
                  const value = e.target.value as 'PROPIO' | 'ANDREANI' | 'MERCADO_ENVIOS';
                  setCarrierType(value);
                  setCourierName(value === 'PROPIO' ? 'Propio' : value === 'ANDREANI' ? 'Andreani' : 'Mercado Envíos');
                }}
                className={pageStyles.formSelectFull}
              >
                <option value="PROPIO">Propio (repartidor interno)</option>
                <option value="ANDREANI">Andreani</option>
                <option value="MERCADO_ENVIOS">Mercado Envíos</option>
              </select>
            </div>
            <Input label="Nombre courier (visible al cliente)" value={courierName} onChange={e => setCourierName(e.target.value)} placeholder="Propio / Andreani / etc." />
            <Input label="Número de tracking" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Opcional" />
            <p className={pageStyles.hintMuted}>
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
                variant="ghost"
                loading={completeManualMutation.isPending}
                onClick={() => {
                  if (!window.confirm('¿Completar la entrega sin OTP? Solo usá esto si el cliente no tiene el código.')) return;
                  completeManualMutation.mutate(completeModal.saleOrderId);
                }}
              >
                Completar sin OTP
              </Button>
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
          <p className={pageStyles.modalIntro}>
            Ingresá el código de 6 dígitos que se envió al cliente al despachar el pedido.
          </p>
          <Input
            label="Código OTP"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className={pageStyles.otpInput}
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
          <p className={pageStyles.modalIntro}>
            Compartí estos links con el cliente y el repartidor. OTP para validación: <strong className={detailStyles.mono}>{linksModal.otpForAdmin}</strong>
          </p>
          <div className={pageStyles.linkStack}>
            <div>
              <label className={pageStyles.linkLabel}>Seguimiento público</label>
              <div className={pageStyles.linkRow}>
                <input readOnly value={linksModal.links.trackingUrl} className={pageStyles.linkInput} />
                <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(linksModal.links.trackingUrl); toast.success('Copiado'); }}>Copiar</Button>
              </div>
            </div>
            <div>
              <label className={pageStyles.linkLabel}>App repartidor</label>
              <div className={pageStyles.linkRow}>
                <input readOnly value={linksModal.links.driverUrl} className={pageStyles.linkInput} />
                <Button variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(linksModal.links.driverUrl); toast.success('Copiado'); }}>Copiar</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
