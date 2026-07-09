import React, { useState } from 'react';
import { Settings2, RefreshCw, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { purchasingApi } from '@/api/purchasing.api';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import styles from './InventoryModals.module.css';

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
        toast.success('El an?lisis finaliz? sin requerir nuevas ?rdenes.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al ejecutar la regla de reposici?n.');
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
    <Modal open={open} onClose={handleClose} title="Reglas de Reposici?n">
      <div className={styles.modalBody}>
        {!result ? (
          <div className={styles.modalStack}>
            <div className={styles.calloutAccent}>
              <div className={styles.calloutAccentRow}>
                <Settings2 size={24} className={styles.calloutAccentIcon} aria-hidden="true" />
                <div>
                  <p className={styles.calloutAccentTitle}>Ejecuci?n Manual de Reposici?n</p>
                  <p className={styles.calloutAccentText}>
                    El sistema analizar? todos los niveles de stock en todas las sucursales. Si encuentra productos cuyo nivel disponible sea igual o menor a su <strong>Punto de Reposici?n</strong>, calcular? la cantidad necesaria para alcanzar el <strong>Stock M?nimo</strong> y generar? ?rdenes de Compra en Borrador agrupadas por proveedor.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.warningBanner}>
              <AlertTriangle size={20} aria-hidden="true" />
              <p className={styles.warningBannerText}>
                Las ?rdenes se generar?n en estado <strong>DRAFT (Borrador)</strong>. Un supervisor deber? revisarlas y emitirlas desde el m?dulo de Compras.
              </p>
            </div>

            <div className={styles.actionsEnd}>
              <Button variant="ghost" onClick={handleClose} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleRun} disabled={isProcessing} icon={isProcessing ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}>
                {isProcessing ? 'Analizando Stock...' : 'Ejecutar Reposici?n Ahora'}
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.resultCenter}>
            <div className={clsx(styles.resultIcon, result.ordersCreated > 0 ? styles.resultIconSuccess : styles.resultIconNeutral)}>
              <CheckCircle size={32} />
            </div>
            <div className={styles.resultTextCenter}>
              <h3 className={styles.resultTitle}>An?lisis Completado</h3>
              <p className={styles.resultText}>{result.message}</p>
            </div>
            <Button variant="primary" onClick={handleClose} className={styles.resultBtn}>
              Entendido
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
