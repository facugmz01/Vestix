import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/utils/formatCurrency';
import { posApi } from '@/api/pos.api';
import toast from 'react-hot-toast';
import styles from '@/pages/pos/POSPage.module.css';

interface QrPaymentModalProps {
  open: boolean;
  amount: number;
  orderId: string | null;
  qrData: string | null;
  isLoading: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
}

export function QrPaymentModal({
  open,
  amount,
  orderId,
  qrData,
  isLoading,
  onClose,
  onPaymentConfirmed,
}: QrPaymentModalProps) {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED'>('PENDING');
  const confirmedRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleApproved = () => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    toast.success('Pago QR confirmado');
    onPaymentConfirmed();
  };

  useEffect(() => {
    if (!open) {
      setStatus('PENDING');
      confirmedRef.current = false;
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    if (!orderId || !qrData) return;

    setStatus('PENDING');
    confirmedRef.current = false;

    const poll = async () => {
      try {
        const res = await posApi.getQrOrderStatus(orderId);
        setStatus(res.status);
        if (res.status === 'APPROVED') handleApproved();
        if (res.status === 'EXPIRED') toast.error('El QR expiró. Generá uno nuevo.');
        if (res.status === 'REJECTED') toast.error('El pago fue rechazado.');
      } catch {
        // Ignore transient polling errors
      }
    };

    poll();

    try {
      const es = new EventSource(`/api/pos/qr-order/${orderId}/events`, { withCredentials: true });
      eventSourceRef.current = es;
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.status) {
            setStatus(payload.status);
            if (payload.status === 'APPROVED') handleApproved();
          }
        } catch { /* ignore */ }
      };
      es.onerror = () => es.close();
    } catch {
      const timer = setInterval(poll, 3000);
      return () => clearInterval(timer);
    }

    const fallbackTimer = setInterval(poll, 5000);
    return () => {
      clearInterval(fallbackTimer);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [open, orderId, qrData, onPaymentConfirmed]);

  return (
    <Modal open={open} onClose={onClose} title="Cobro con QR Mercadopago">
      <div className={styles.qrStack}>
        <div className={styles.qrAmountBox}>
          <div className={styles.qrAmountLabel}>Monto a cobrar</div>
          <div className={styles.qrAmountValue}>{formatCurrency(amount)}</div>
        </div>

        {isLoading ? (
          <div className={styles.qrLoading}>
            <Loader2 className="spinner" size={48} color="var(--accent)" />
            <span className={styles.qrLoadingText}>Generando QR dinámico...</span>
          </div>
        ) : qrData ? (
          <div className={styles.qrCodeWrap}>
            <QRCodeSVG value={qrData} size={200} level="H" includeMargin={false} />
          </div>
        ) : (
          <div className={styles.qrError}>
            <AlertCircle size={20} /> Error al generar QR
          </div>
        )}

        {qrData && status === 'PENDING' && (
          <div className={styles.qrPendingStack}>
            <div className={styles.qrPendingStatus}>
              <Loader2 className="spinner" size={16} /> Esperando confirmación de pago...
            </div>
            <span className={styles.qrPendingHint}>
              El pago se confirma automáticamente cuando Mercado Pago notifica el cobro (webhook + polling).
            </span>
          </div>
        )}

        {status === 'APPROVED' && (
          <div className={styles.qrApproved}>
            <Check size={20} /> Pago confirmado
          </div>
        )}

        {status === 'EXPIRED' && (
          <div className={styles.qrExpired}>QR expirado — generá uno nuevo.</div>
        )}
      </div>
    </Modal>
  );
}
