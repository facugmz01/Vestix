import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Navigation, MapPin, Camera, CheckCircle, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi } from '@/api/shipping.api';
import {
  enqueueGpsPoint,
  flushGpsQueue,
  listenForGpsFlush,
  registerDriverServiceWorker,
} from '@/utils/driverOfflineQueue';
import styles from './DriverDeliveryPage.module.css';

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
    return <div className={styles.loading}>Cargando entrega...</div>;
  }

  const isDelivered = delivery.status === 'DELIVERED' || delivery.fulfillmentStatus === 'DELIVERED';

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <div className={styles.iconBox}>
            <Truck size={24} color="white" />
          </div>
          <div>
            <h1 className={styles.title}>Entrega #{delivery.orderRef}</h1>
            <p className={styles.subtitle}>{delivery.status}</p>
          </div>
        </div>

        <div className={styles.customerBlock}>
          <p className={styles.customerName}>{delivery.customerName}</p>
          {delivery.customerPhone && (
            <a href={`tel:${delivery.customerPhone}`} className={styles.phoneLink}>{delivery.customerPhone}</a>
          )}
        </div>

        {delivery.shippingAddress && (
          <div className={styles.addressBox}>
            <MapPin size={16} className={styles.pinIcon} />
            <p className={styles.addressText}>
              {delivery.shippingAddress.address}<br />
              {delivery.shippingAddress.city}, {delivery.shippingAddress.state}
            </p>
          </div>
        )}

        <p className={styles.itemCount}>
          {delivery.lines.reduce((a: number, l: { quantity: number }) => a + l.quantity, 0)} artículos
        </p>
      </div>

      {!isDelivered && (
        <>
          <button
            type="button"
            onClick={() => setGpsActive(v => !v)}
            className={clsx(styles.gpsBtn, gpsActive ? styles.gpsActive : styles.gpsIdle)}
          >
            <Navigation size={20} />
            {gpsActive ? 'GPS activo — compartiendo ubicación' : 'Iniciar GPS en vivo'}
          </button>
          {offlinePending > 0 && (
            <p className={styles.offlineNote}>
              {offlinePending} ubicación(es) pendiente(s) de envío
            </p>
          )}

          <button
            type="button"
            onClick={() => arriveMutation.mutate()}
            disabled={arriveMutation.isPending}
            className={styles.secondaryBtn}
          >
            Llegué al destino
          </button>

          {delivery.settings.requirePhotoOnDelivery && (
            <label className={styles.photoLabel}>
              <Camera size={18} />
              Subir foto de entrega
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className={styles.hiddenInput}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) photoMutation.mutate(file);
                }}
              />
            </label>
          )}

          <div className={styles.completeCard}>
            <h3 className={styles.completeTitle}>Completar entrega</h3>
            <p className={styles.completeHint}>
              Pedile al cliente el código de 6 dígitos que recibió por WhatsApp.
            </p>
            <input
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className={styles.otpInput}
            />
            <button
              type="button"
              disabled={otp.length !== 6 || completeMutation.isPending}
              onClick={() => completeMutation.mutate({
                otp,
                latitude: lastCoords.current?.lat,
                longitude: lastCoords.current?.lng,
              })}
              className={clsx(styles.confirmBtn, otp.length !== 6 && styles.confirmBtnDisabled)}
            >
              <CheckCircle size={18} />
              Confirmar entrega
            </button>
          </div>
        </>
      )}

      {isDelivered && (
        <div className={styles.successCard}>
          <CheckCircle size={48} color="#22c55e" className={styles.successIcon} />
          <h2 className={styles.successTitle}>Entrega completada</h2>
        </div>
      )}
    </div>
  );
}
