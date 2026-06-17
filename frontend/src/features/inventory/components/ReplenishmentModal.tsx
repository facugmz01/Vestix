import React, { useState } from 'react';
import { Settings2, RefreshCw, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { purchasingApi } from '@/api/purchasing.api';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReplenishmentModal({ open, onClose, onSuccess }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ message: string; ordersCreated: number } | null>(null);

  const handleRun = async () => {
    setIsProcessing(true);
    try {
      const res = await purchasingApi.autoReplenish();
      setResult({ message: res.message, ordersCreated: res.ordersCreated });
      if (res.ordersCreated > 0) {
        toast.success(res.message);
      } else {
        toast.success('El análisis finalizó sin requerir nuevas órdenes.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al ejecutar la regla de reposición.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setIsProcessing(false);
    if (result && result.ordersCreated > 0) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Reglas de Reposición">
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {!result ? (
          <>
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Settings2 size={24} color="var(--accent)" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '15px' }}>Ejecución Manual de Reposición</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    El sistema analizará todos los niveles de stock en todas las sucursales. Si encuentra productos cuyo nivel disponible sea igual o menor a su <strong>Punto de Reposición</strong>, calculará la cantidad necesaria para alcanzar el <strong>Stock Mínimo</strong> y generará Órdenes de Compra en Borrador agrupadas por proveedor.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', borderRadius: '8px' }}>
              <AlertTriangle size={20} style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.4 }}>
                Las órdenes se generarán en estado <strong>DRAFT (Borrador)</strong>. Un supervisor deberá revisarlas y emitirlas desde el módulo de Compras.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="ghost" onClick={handleClose} disabled={isProcessing} style={{ marginRight: '8px' }}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleRun} disabled={isProcessing} icon={isProcessing ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}>
                {isProcessing ? 'Analizando Stock...' : 'Ejecutar Reposición Ahora'}
              </Button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '32px', background: result.ordersCreated > 0 ? '#10b98120' : 'var(--bg-surface)', color: result.ordersCreated > 0 ? '#10b981' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={32} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Análisis Completado</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {result.message}
              </p>
            </div>
            <Button variant="primary" onClick={handleClose} style={{ marginTop: '10px' }}>
              Entendido
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
