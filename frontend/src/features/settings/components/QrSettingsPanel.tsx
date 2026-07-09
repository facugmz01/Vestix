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
          <div className={styles.infoBox}>
            <Info size={16} className={styles.infoBoxIcon} aria-hidden="true" />
            <div className={styles.infoBoxBody}>
              <p className={styles.infoBoxParagraph}>
                <strong>Requisitos:</strong> activá Mercado Pago y cargá credenciales en{' '}
                <strong className={styles.infoBoxAccent}>Configuración → Integraciones (Apps)</strong>.
              </p>
              <p className={styles.infoBoxParagraph}>
                Para QR híbrido con caja fija, configurá también el <strong>External POS ID</strong> en esa misma sección.
              </p>
            </div>
          </div>

          <div className={styles.constrainedField}>
            <Input label="Nombre del comercio en MercadoPago" placeholder="Ej: Facundo Gomez" {...register('mpStoreName')} />
            <p className={styles.fieldHint}>Este nombre aparece en la app de MP cuando el cliente escanea.</p>
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
