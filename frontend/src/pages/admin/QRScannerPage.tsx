import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';

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
    } catch (err: any) {
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
    
    // Si el QR tiene un prefijo de orden, llevarlo al POS o Facturas
    if (scanResult.startsWith('ORD-') || scanResult.startsWith('CART-')) {
      // Logica de navegacion hipotetica (e.g. buscar orden)
      navigate('/pos', { state: { loadCartId: scanResult } });
    } else {
      // Por defecto, buscar producto en catálogo
      navigate(`/admin/catalog?search=${encodeURIComponent(scanResult)}`);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Scan size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Escáner Inteligente</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Escanea códigos de barras o QR de productos y comprobantes.
          </p>
        </div>
      </header>

      <div style={{ 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Lector Container */}
        <div 
          id="qr-reader" 
          style={{ 
            width: '100%', 
            maxWidth: '320px', 
            minHeight: isScanning ? '320px' : '200px',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius)',
            border: isScanning ? '2px solid var(--accent)' : '1px dashed var(--border)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!isScanning && !scanResult && (
            <p style={{ color: 'var(--text-muted)' }}>Cámara inactiva</p>
          )}
        </div>

        {error && <p style={{ color: 'var(--red)', fontSize: '14px', margin: 0 }}>{error}</p>}

        {scanResult ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '16px' }}>
              <CheckCircle2 size={24} />
              <h3 style={{ margin: 0 }}>¡Código detectado!</h3>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-base)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', wordBreak: 'break-all', marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>
              {scanResult}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <Button onClick={startScanning} variant="outline" style={{ flex: 1 }}>
                <RefreshCw size={16} /> Re-escanear
              </Button>
              <Button onClick={handleAction} style={{ flex: 2 }}>
                Procesar
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={isScanning ? stopScanning : startScanning} 
            variant={isScanning ? 'outline' : 'primary'}
            style={{ width: '100%', maxWidth: '320px' }}
          >
            {isScanning ? 'Detener Cámara' : 'Iniciar Escáner'}
          </Button>
        )}
      </div>
    </div>
  );
}
