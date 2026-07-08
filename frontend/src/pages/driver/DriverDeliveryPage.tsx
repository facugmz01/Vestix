import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Navigation, MapPin, Camera, CheckCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '@/api/shipping.api';
import {
  enqueueGpsPoint,
  flushGpsQueue,
  listenForGpsFlush,
  registerDriverServiceWorker,
} from '@/utils/driverOfflineQueue';

export default function DriverDeliveryPage() {
  const { token } = useParams<{ token: string }>();
  const watchIdRef = useRef<number | null>(null);
  const [otp, setOtp] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [offlinePending, setOfflinePending] = useState(0);

  const sendLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!token) return;
    if (!navigator.onLine) {
      enqueueGpsPoint(token, latitude, longitude);
      setOfflinePending((n) => n + 1);
      return;
    }
    await driverApi.updateLocation(token, latitude, longitude);
  }, [token]);

  const flushQueue = useCallback(async () => {
    if (!token || !navigator.onLine) return;
    await flushGpsQueue(token, async (lat, lng) => {
      await driverApi.updateLocation(token, lat, lng);
    });
    setOfflinePending(0);
  }, [token]);

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

  const { data: delivery, isLoading, refetch } = useQuery({
    queryKey: ['driver', 'delivery', token],
    queryFn: () => driverApi.getDelivery(token!),
    enabled: !!token,
  });

  const locationMutation = useMutation({
    mutationFn: (coords: { latitude: number; longitude: number }) =>
      sendLocation(coords.latitude, coords.longitude),
    onError: () => {
      if (!navigator.onLine && token) {
        toast('Sin conexión — ubicación guardada para reenvío', { icon: '📡' });
        return;
      }
      toast.error('Error al enviar ubicación');
    },
  });

  const arriveMutation = useMutation({
    mutationFn: () => driverApi.markArrived(token!),
    onSuccess: () => { toast.success('Llegada registrada'); refetch(); },
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => driverApi.uploadPhoto(token!, file),
    onSuccess: () => { toast.success('Foto subida'); refetch(); },
    onError: () => toast.error('Error al subir foto'),
  });

  const completeMutation = useMutation({
    mutationFn: (payload: { otp: string; latitude?: number; longitude?: number }) =>
      driverApi.completeDelivery(token!, payload.otp, payload.latitude, payload.longitude),
    onSuccess: () => { toast.success('¡Entrega completada!'); refetch(); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al completar entrega'),
  });

  const lastCoords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!gpsActive || !token || delivery?.status === 'DELIVERED') return;

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
  }, [gpsActive, token, delivery?.status]);

  if (isLoading || !delivery) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando entrega...
      </div>
    );
  }

  const isDelivered = delivery.status === 'DELIVERED' || delivery.fulfillmentStatus === 'DELIVERED';

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Truck size={24} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Entrega #{delivery.orderRef}</h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{delivery.status}</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{delivery.customerName}</p>
          {delivery.customerPhone && (
            <a href={`tel:${delivery.customerPhone}`} style={{ color: '#3b82f6', fontSize: '14px' }}>{delivery.customerPhone}</a>
          )}
        </div>

        {delivery.shippingAddress && (
          <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '16px' }}>
            <MapPin size={16} style={{ marginBottom: '4px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>
              {delivery.shippingAddress.address}<br />
              {delivery.shippingAddress.city}, {delivery.shippingAddress.state}
            </p>
          </div>
        )}

        <p style={{ fontSize: '14px', color: '#64748b' }}>
          {delivery.lines.reduce((a: number, l: { quantity: number }) => a + l.quantity, 0)} artículos
        </p>
      </div>

      {!isDelivered && (
        <>
          <button
            onClick={() => setGpsActive(v => !v)}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
              background: gpsActive ? '#22c55e' : '#3b82f6', color: '#fff',
              fontWeight: 700, fontSize: '16px', marginBottom: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Navigation size={20} />
            {gpsActive ? 'GPS activo — compartiendo ubicación' : 'Iniciar GPS en vivo'}
          </button>
          {offlinePending > 0 && (
            <p style={{ fontSize: '13px', color: '#b45309', textAlign: 'center', margin: '0 0 12px' }}>
              {offlinePending} ubicación(es) pendiente(s) de envío
            </p>
          )}

          <button
            onClick={() => arriveMutation.mutate()}
            disabled={arriveMutation.isPending}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0',
              background: '#fff', fontWeight: 600, marginBottom: '12px',
            }}
          >
            Llegué al destino
          </button>

          {delivery.settings.requirePhotoOnDelivery && (
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
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) photoMutation.mutate(file);
                }}
              />
            </label>
          )}

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px', fontWeight: 800 }}>Completar entrega</h3>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b' }}>
              Pedile al cliente el código de 6 dígitos que recibió por WhatsApp.
            </p>
            <input
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%', padding: '12px', fontSize: '24px', letterSpacing: '8px',
                textAlign: 'center', fontFamily: 'monospace', borderRadius: '8px',
                border: '1px solid #e2e8f0', marginBottom: '12px',
              }}
            />
            <button
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

      {isDelivered && (
        <div style={{ textAlign: 'center', padding: '32px', background: '#f0fdf4', borderRadius: '12px' }}>
          <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '12px' }} />
          <h2 style={{ margin: 0, color: '#166534' }}>Entrega completada</h2>
        </div>
      )}
    </div>
  );
}
