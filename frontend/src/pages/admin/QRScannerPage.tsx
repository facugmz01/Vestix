import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { giftCardsApi } from '@/api/gift-cards.api';
import { extractGiftCardVerifyToken } from '@/features/gift-cards/utils/giftCardVerify';
import { GiftCardVerifyResult } from '@/features/gift-cards/components/GiftCardVerifyResult';
import styles from './QRScannerPage.module.css';

const READER_ID = 'qr-reader';

async function teardownScanner(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    // Camera may already be stopped during unmount / remount races.
  }
  try {
    scanner.clear();
  } catch {
    // Element may already be gone from the DOM.
  }
}

export default function QRScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const navigate = useNavigate();

  const verifyMutation = useMutation({
    mutationFn: (token: string) => giftCardsApi.verify(token),
  });

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      void teardownScanner(scanner);
    };
  }, []);

  const stopScanning = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    await teardownScanner(scanner);
    setIsScanning(false);
  };

  const startScanning = async () => {
    setError(null);
    setScanResult(null);
    verifyMutation.reset();

    try {
      await stopScanning();

      // `#qr-reader` must stay free of React-managed children; html5-qrcode owns its DOM.
      scannerRef.current = new Html5Qrcode(READER_ID);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanResult(decodedText);
          void stopScanning();
          const token = extractGiftCardVerifyToken(decodedText);
          if (token) verifyMutation.mutate(token);
        },
        () => {},
      );
      setIsScanning(true);
    } catch (err: unknown) {
      await teardownScanner(scannerRef.current);
      scannerRef.current = null;
      setIsScanning(false);
      setError('No se pudo acceder a la cámara. Asegúrate de dar los permisos.');
      console.error(err);
    }
  };

  const giftCardToken = scanResult ? extractGiftCardVerifyToken(scanResult) : null;

  const handleAction = () => {
    if (!scanResult) return;

    if (giftCardToken) {
      verifyMutation.mutate(giftCardToken);
      return;
    }

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
            Escaneá QR de gift cards para validar legitimidad, o códigos de productos y comprobantes.
          </p>
        </div>
      </header>

      <div className={styles.panel}>
        <div
          className={clsx(
            styles.readerShell,
            isScanning ? styles.readerActive : styles.readerIdle,
          )}
        >
          {!isScanning && !scanResult && (
            <p className={styles.readerPlaceholder}>Cámara inactiva</p>
          )}
          {/* Keep empty: html5-qrcode mutates this node directly. */}
          <div id={READER_ID} className={styles.reader} />
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

            {verifyMutation.isPending && (
              <p className={styles.verifyLoading}>Verificando gift card...</p>
            )}

            {verifyMutation.data && (
              <GiftCardVerifyResult result={verifyMutation.data} compact />
            )}

            {verifyMutation.isError && giftCardToken && (
              <p className={styles.errorText}>
                No se pudo verificar la gift card. El QR puede ser inválido o estar vencido.
              </p>
            )}

            <div className={styles.actionRow}>
              <Button onClick={startScanning} variant="outline" className={styles.btnFlex1}>
                <RefreshCw size={16} /> Re-escanear
              </Button>
              {!giftCardToken && (
                <Button onClick={handleAction} className={styles.btnFlex2}>
                  Procesar
                </Button>
              )}
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
