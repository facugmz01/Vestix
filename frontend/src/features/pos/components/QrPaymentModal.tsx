import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatCurrency } from '@/utils/formatCurrency';

interface QrPaymentModalProps {
  open: boolean;
  amount: number;
  qrData: string | null; // The string returned by MercadoPago to encode in QR
  isLoading: boolean;
  onClose: () => void;
  onForceConfirm: () => void;
}

export const QrPaymentModal: React.FC<QrPaymentModalProps> = ({ 
  open, amount, qrData, isLoading, onClose, onForceConfirm 
}) => {
  const [polling, setPolling] = useState(true);


  // Simulated polling for webhook confirmation
  useEffect(() => {
    if (open && qrData) {
      setPolling(true);
      // In a real app, we'd open a WebSocket or poll the backend
      // `const timer = setInterval(() => checkPaymentStatus(orderId), 3000)`
    }
  }, [open, qrData]);

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

        {qrData && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '14px' }}>
              <Loader2 className="spinner" size={16} /> Esperando escaneo del cliente...
            </div>
            
            <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

            <Button 
              variant="primary" 
              onClick={onForceConfirm} 
              style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
            >
              <Check size={18} style={{ marginRight: '8px' }} /> Forzar Confirmación (Pago Exitoso)
            </Button>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Usá "Forzar Confirmación" si el cliente ya pagó y la terminal no se actualizó automáticamente.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};
