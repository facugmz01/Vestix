import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, QrCode, Info } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input, Button } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { qrSettingsSchema, type QrSettingsFormData } from '../schemas/qrSettings.schema';
import styles from './GeneralSettingsPanel.module.css';

export function QrSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('qr');

  const { register, watch, handleSubmit, reset, setValue, formState: { isDirty } } = useForm<QrSettingsFormData>({
    resolver: zodResolver(qrSettingsSchema),
  });

  useEffect(() => {
    if (settings?.qr) reset(settings.qr);
  }, [settings, reset]);

  const onSubmit = (data: QrSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const isConfigured = watch('qrGenerated');

  const handleGenerateQr = () => {
    toast.success('QR generado exitosamente');
    setValue('qrGenerated', true, { shouldDirty: true });
  };

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h3 className={styles.cardTitle}><QrCode size={18} /> QR de cobro con MercadoPago</h3>
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
          <p className={styles.cardDescription}>
            Generá un QR permanente vinculado a tu cuenta de MercadoPago para el mostrador.
          </p>
        </header>

        <div className={styles.cardBody}>
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <Info size={16} color="#06b6d4" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong>Requisito:</strong> necesitás tener configurado MercadoPago en la pestaña <strong style={{ color: 'var(--accent)' }}>Integraciones</strong>.
            </p>
          </div>

          <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <Input label="Nombre del comercio en MercadoPago" placeholder="Ej: Facundo Gomez" {...register('mpStoreName')} />
            <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Este nombre aparece en la app de MP cuando el cliente escanea.</p>
          </div>

          <Button type="button" variant="primary" icon={<QrCode size={16} />} style={{ background: '#3b82f6', width: 'fit-content' }} onClick={handleGenerateQr}>
            Generar QR de cobro
          </Button>
        </div>

        <footer className={styles.saveFooter}>
          <Button type="submit" variant="primary" loading={mutation.isPending} disabled={!isDirty} icon={<Save size={16} />}>Guardar Opciones</Button>
        </footer>
      </section>

    </form>
  );
}
