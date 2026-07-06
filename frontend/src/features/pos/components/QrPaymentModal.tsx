import { useState, useEffect, useRef } from 'react';
import { Modal, Button } from '@/components/ui';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/utils/formatCurrency';
import { posApi } from '@/api/pos.api';
import toast from 'react-hot-toast';

interface QrPaymentModalProps {
  open: boolean;
  amount: number;
  orderId: string | null;
  qrData: string | null;
  isLoading: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
  onForceConfirm: () => void;
}

export function QrPaymentModal({
  open,
  amount,
  orderId,
  qrData,
  isLoading,
  onClose,
  onPaymentConfirmed,
  onForceConfirm,
}: QrPaymentModalProps) {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED'>('PENDING');
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setStatus('PENDING');
      confirmedRef.current = false;
      return;
    }

    if (!orderId || !qrData) return;

    setStatus('PENDING');
    confirmedRef.current = false;

    const poll = async () => {
      try {
        const res = await posApi.getQrOrderStatus(orderId);
        setStatus(res.status);
        if (res.status === 'APPROVED' && !confirmedRef.current) {
          confirmedRef.current = true;
          toast.success('Pago QR confirmado');
          onPaymentConfirmed();
        }
        if (res.status === 'EXPIRED') {
          toast.error('El QR expiró. Generá uno nuevo.');
        }
      } catch {
        // Ignore transient polling errors
      }
    };

    poll();
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [open, orderId, qrData, onPaymentConfirmed]);

  const handleForceConfirm = async () => {
    if (!orderId) {
      onForceConfirm();
      return;
    }
    setIsConfirming(true);
    try {
      await posApi.confirmQrOrder(orderId);
      setStatus('APPROVED');
      onPaymentConfirmed();
    } catch {
      onForceConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Cobro con QR Mercadopago">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '10px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Monto a cobrar</div>
          <div style={{ fontSize: '36px', fontWeight: 800, color: '#34d399' }}>{formatCurrency(amount)}</div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px' }}>
            <Loader2 className="spinner" size={48} color="#3b82f6" />
            <span style={{ color: 'var(--text-secondary)' }}>Generando QR dinámico...</span>
          </div>
        ) : qrData ? (
          <div style={{ background: '#fff', padding: '16px', borderRadius: '16px', border: '4px solid #009ee3' }}>
            <QRCodeSVG value={qrData} size={200} level="H" includeMargin={false} />
          </div>
        ) : (
          <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> Error al generar QR
          </div>
        )}

        {qrData && status === 'PENDING' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '14px' }}>
              <Loader2 className="spinner" size={16} /> Esperando confirmación de pago...
            </div>

            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

            <Button
              variant="primary"
              onClick={handleForceConfirm}
              loading={isConfirming}
              style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
            >
              <Check size={18} style={{ marginRight: '8px' }} /> Confirmar Pago Manualmente
            </Button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              El sistema verifica el pago automáticamente cada 3 segundos.
            </span>
          </div>
        )}

        {status === 'APPROVED' && (
          <div style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={20} /> Pago confirmado
          </div>
        )}

        {status === 'EXPIRED' && (
          <div style={{ color: '#f87171', fontSize: '14px', textAlign: 'center' }}>
            El código QR expiró. Cerrá este modal y generá uno nuevo.
          </div>
        )}
      </div>
    </Modal>
  );
}
