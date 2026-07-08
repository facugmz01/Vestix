import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navigation, MapPin, Camera, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryPortalApi } from '@/api/deliveryPortal.api';
import {
  enqueueGpsPoint,
  flushGpsQueue,
  listenForGpsFlush,
  registerDriverServiceWorker,
} from '@/utils/driverOfflineQueue';

export default function DeliveryRunPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const navigate = useNavigate();
  const watchIdRef = useRef<number | null>(null);
  const [otp, setOtp] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [offlinePending, setOfflinePending] = useState(0);

  const { data: delivery, isLoading, refetch } = useQuery({
    queryKey: ['delivery-portal', 'assignment', deliveryId],
    queryFn: () => deliveryPortalApi.getAssignment(deliveryId!),
    enabled: !!deliveryId,
  });

  const sendLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!deliveryId) return;
    if (!navigator.onLine) {
      enqueueGpsPoint(deliveryId, latitude, longitude);
      setOfflinePending((n) => n + 1);
      return;
    }
    await deliveryPortalApi.updateLocation(deliveryId, latitude, longitude);
  }, [deliveryId]);

  const flushQueue = useCallback(async () => {
    if (!deliveryId || !navigator.onLine) return;
    await flushGpsQueue(deliveryId, async (lat, lng) => {
      await deliveryPortalApi.updateLocation(deliveryId, lat, lng);
    });
    setOfflinePending(0);
  }, [deliveryId]);

  useEffect(() => {
    registerDriverServiceWorker();
    const unlisten = listenForGpsFlush(() => { void flushQueue(); });
    const onOnline = () => { void flushQueue(); };
    window.addEventListener('online', onOnline);
    return () => {
      unlisten();
      window.removeEventListener('online', onOnline);
    };
  }, [flushQueue]);

  const locationMutation = useMutation({
    mutationFn: (coords: { latitude: number; longitude: number }) =>
      sendLocation(coords.latitude, coords.longitude),
    onError: () => {
      if (!navigator.onLine && deliveryId) {
        toast('Sin conexión — ubicación guardada para reenvío', { icon: '📡' });
        return;
      }
      toast.error('Error al enviar ubicación');
    },
  });

  const arriveMutation = useMutation({
    mutationFn: () => deliveryPortalApi.markArrived(deliveryId!),
    onSuccess: () => { toast.success('Llegada registrada'); refetch(); },
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => deliveryPortalApi.uploadPhoto(deliveryId!, file),
    onSuccess: () => { toast.success('Foto subida'); refetch(); },
    onError: () => toast.error('Error al subir foto'),
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { otp: string; latitude?: number; longitude?: number }) =>
      deliveryPortalApi.completeDelivery(
        deliveryId!,
        payload.otp,
        payload.latitude,
        payload.longitude,
      ),
    onSuccess: () => {
      toast.success('¡Entrega completada!');
      navigate('/delivery', { replace: true });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al completar entrega'),
  });

  const lastCoords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!gpsActive || !deliveryId || delivery?.status === 'DELIVERED') return;
    if (!navigator.geolocation) {
      toast.error('GPS no disponible');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        lastCoords.current = { lat: latitude, lng: longitude };
        locationMutation.mutate({ latitude, longitude });
      },
      () => toast.error('No se pudo obtener GPS'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 },
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [gpsActive, deliveryId, delivery?.status]);

  if (isLoading || !delivery) {
    return <div style={{ padding: '32px 0', textAlign: 'center' }}>Cargando entrega...</div>;
  }

  const isDelivered = delivery.status === 'DELIVERED' || delivery.fulfillmentStatus === 'DELIVERED';

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/delivery')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          border: 'none', background: 'transparent', color: '#64748b',
          marginBottom: '16px', cursor: 'pointer', fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900 }}>Pedido #{delivery.orderRef}</h1>
        <p style={{ margin: 0, color: '#64748b' }}>{delivery.status}</p>
        <p style={{ margin: '12px 0 0', fontWeight: 700 }}>{delivery.customerName}</p>
        {delivery.customerPhone && (
          <a href={`tel:${delivery.customerPhone}`} style={{ color: '#3b82f6', fontSize: '14px' }}>
            {delivery.customerPhone}
          </a>
        )}
        {delivery.shippingAddress && (
          <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
            <MapPin size={16} />
            <p style={{ margin: '6px 0 0', fontSize: '14px' }}>
              {delivery.shippingAddress.address}<br />
              {delivery.shippingAddress.city}, {delivery.shippingAddress.state}
            </p>
          </div>
        )}
      </div>

      {!isDelivered && (
        <>
          <button
            type="button"
            onClick={() => setGpsActive((v) => !v)}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
              background: gpsActive ? '#22c55e' : '#7c3aed', color: '#fff',
              fontWeight: 700, marginBottom: '12px',
            }}
          >
            <Navigation size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
            {gpsActive ? 'GPS activo' : 'Iniciar GPS en vivo'}
          </button>

          {offlinePending > 0 && (
            <p style={{ fontSize: '13px', color: '#b45309', textAlign: 'center' }}>
              {offlinePending} ubicación(es) pendiente(s)
            </p>
          )}

          <button
            type="button"
            onClick={() => arriveMutation.mutate()}
            disabled={arriveMutation.isPending}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px',
              border: '1px solid #e2e8f0', background: '#fff', fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Llegué al destino
          </button>

          {delivery.settings?.requirePhotoOnDelivery && (
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '14px', borderRadius: '12px', border: '1px dashed #8b5cf6',
              background: '#faf5ff', fontWeight: 600, marginBottom: '12px', cursor: 'pointer',
            }}>
              <Camera size={18} />
              Subir foto de entrega
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) photoMutation.mutate(file);
                }}
              />
            </label>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px' }}>Completar entrega</h3>
            <input
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%', padding: '12px', fontSize: '24px', letterSpacing: '8px',
                textAlign: 'center', fontFamily: 'monospace', borderRadius: '8px',
                border: '1px solid #e2e8f0', marginBottom: '12px',
              }}
            />
            <button
              type="button"
              disabled={otp.length !== 6 || completeMutation.isPending}
              onClick={() => completeMutation.mutate({
                otp,
                latitude: lastCoords.current?.lat,
                longitude: lastCoords.current?.lng,
              })}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: '#22c55e', color: '#fff', fontWeight: 700,
                opacity: otp.length !== 6 ? 0.5 : 1,
              }}
            >
              <CheckCircle size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
              Confirmar entrega
            </button>
          </div>
        </>
      )}
    </div>
  );
}
