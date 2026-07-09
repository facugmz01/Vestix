import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import styles from './QRScannerPage.module.css';

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    scannerRef.current = new Html5Qrcode('qr-reader');
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    setError(null);
    setScanResult(null);
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanResult(decodedText);
          stopScanning();
        },
        () => {
          // Ignore frequent "not found" errors
        }
      );
      setIsScanning(true);
    } catch (err: unknown) {
      setError('No se pudo acceder a la cámara. Asegúrate de dar los permisos.');
      console.error(err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  };

  const handleAction = () => {
    if (!scanResult) return;
    
    if (scanResult.startsWith('ORD-') || scanResult.startsWith('CART-')) {
      navigate('/pos', { state: { loadCartId: scanResult } });
    } else {
      navigate(`/admin/catalog?search=${encodeURIComponent(scanResult)}`);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <Scan size={24} />
        </div>
        <div>
          <h1 className={styles.title}>Escáner Inteligente</h1>
          <p className={styles.subtitle}>
            Escanea códigos de barras o QR de productos y comprobantes.
          </p>
        </div>
      </header>

      <div className={styles.panel}>
        <div
          id="qr-reader"
          className={clsx(styles.reader, isScanning ? styles.readerActive : styles.readerIdle)}
        >
          {!isScanning && !scanResult && (
            <p className={styles.readerPlaceholder}>Cámara inactiva</p>
          )}
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        {scanResult ? (
          <div className={styles.resultPanel}>
            <div className={styles.successRow}>
              <CheckCircle2 size={24} />
              <h3 className={styles.successTitle}>¡Código detectado!</h3>
            </div>
            <div className={styles.resultCode}>
              {scanResult}
            </div>
            
            <div className={styles.actionRow}>
              <Button onClick={startScanning} variant="outline" className={styles.btnFlex1}>
                <RefreshCw size={16} /> Re-escanear
              </Button>
              <Button onClick={handleAction} className={styles.btnFlex2}>
                Procesar
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={isScanning ? stopScanning : startScanning} 
            variant={isScanning ? 'outline' : 'primary'}
            className={styles.scanBtn}
          >
            {isScanning ? 'Detener Cámara' : 'Iniciar Escáner'}
          </Button>
        )}
      </div>
    </div>
  );
}
