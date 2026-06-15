import { useFormContext } from 'react-hook-form';
import { SettingsSection } from './SettingsLayout';
import { Input, Button } from '@/components/ui';
import { SystemSettings } from '@/api/settings.api';
import { QrCode, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export function QrSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  const isConfigured = watch('qr.qrGenerated');

  const handleGenerateQr = () => {
    toast.success('QR generado exitosamente');
    setValue('qr.qrGenerated', true, { shouldDirty: true });
  };

  return (
    <SettingsSection 
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={18} color="var(--accent)" /> QR de cobro con MercadoPago
          </span>
          <span style={{ 
            background: isConfigured ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-elevated)', 
            color: isConfigured ? '#10b981' : 'var(--text-muted)', 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '11px', 
            fontWeight: 600,
            border: `1px solid ${isConfigured ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`
          }}>
            {isConfigured ? 'Configurado' : 'No configurado'}
          </span>
        </div>
      }
    >
      <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.6' }}>
        Generá un QR permanente vinculado a tu cuenta de MercadoPago. Lo imprimís una vez y lo pegás en el mostrador. Cada vez que el cajero activa un monto desde el sistema, el cliente escanea ese QR y la app de MP le muestra el importe exacto a pagar.
      </p>

      <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Info size={16} color="#06b6d4" />
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
          <strong>Requisito:</strong> necesitás tener configurado el Access Token de MercadoPago en la pestaña <a href="#" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Tienda Web</a>
        </p>
      </div>

      <div style={{ marginBottom: '16px', width: '100%', maxWidth: '400px' }}>
        <Input 
          label="Nombre del comercio en MercadoPago" 
          placeholder="Ej: Facundo Gomez" 
          {...register('qr.mpStoreName')} 
        />
        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Este nombre aparece en la app de MP cuando el cliente escanea.
        </p>
      </div>

      <Button 
        variant="primary" 
        icon={<QrCode size={16} />} 
        style={{ background: '#3b82f6' }}
        onClick={handleGenerateQr}
      >
        Generar QR de cobro
      </Button>

    </SettingsSection>
  );
}
