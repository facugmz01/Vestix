import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, QrCode, Info } from 'lucide-react';

import { Input, Button } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { qrSettingsSchema, type QrSettingsFormData } from '../schemas/qrSettings.schema';
import clsx from 'clsx';
import styles from './SettingsShared.module.css';

export function QrSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('qr');

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<QrSettingsFormData>({
    resolver: zodResolver(qrSettingsSchema),
  });

  useEffect(() => {
    if (settings?.qr) reset(settings.qr);
  }, [settings, reset]);

  const onSubmit = (data: QrSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><QrCode size={18} /> QR de cobro con MercadoPago</h3>
          <p className={styles.cardDescription}>
            Configuración de referencia para cobros QR en mostrador. Los QR dinámicos del POS se generan contra la API real de Mercado Pago.
          </p>
        </header>

        <div className={styles.cardBody}>
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <Info size={16} color="#06b6d4" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Requisitos:</strong> credenciales en <strong style={{ color: 'var(--accent)' }}>Integraciones → Mercado Pago</strong> (Access Token TEST- o APP_USR-).
              </p>
              <p style={{ margin: 0 }}>
                Para QR híbrido con caja fija, configurá también el <strong>External POS ID</strong> en Integraciones. El QR dinámico del POS se crea al cobrar, sin simulaciones.
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <Input label="Nombre del comercio en MercadoPago" placeholder="Ej: Facundo Gomez" {...register('mpStoreName')} />
            <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Este nombre aparece en la app de MP cuando el cliente escanea.</p>
          </div>
        </div>
      </section>

      <div className={clsx(styles.stickySaveBar, { [styles.visible]: isDirty })}>
        <p className={styles.unsavedText}>Tienes cambios sin guardar</p>
        <Button
          type="submit"
          variant="primary"
          loading={mutation.isPending}
          disabled={!isDirty || mutation.isPending}
          icon={<Save size={16} />}
          aria-live="polite"
        >
          {mutation.isPending ? 'Guardando...' : 'Guardar Opciones'}
        </Button>
      </div>
    </form>
  );
}
