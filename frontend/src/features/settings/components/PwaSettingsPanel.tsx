import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Download, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input, Button } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { pwaSettingsSchema, type PwaSettingsFormData } from '../schemas/pwaSettings.schema';
import clsx from 'clsx';
import styles from './SettingsShared.module.css';

export function PwaSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('pwa');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<PwaSettingsFormData>({
    resolver: zodResolver(pwaSettingsSchema),
  });

  useEffect(() => {
    if (settings?.pwa) reset(settings.pwa);
  }, [settings, reset]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const onSubmit = (data: PwaSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Smartphone size={18} /> App móvil / PWA</h3>
          <p className={styles.cardDescription}>Configura cómo se verá tu Tienda cuando los usuarios la instalen en sus dispositivos.</p>
        </header>

        <div className={styles.cardBody}>
          <div className={styles.grid}>
            <Input label="Nombre de la App *" placeholder="Ej: Mi Tienda Online" {...register('appName')} error={errors.appName?.message} />
            <Input label="Nombre Corto *" placeholder="Ej: MiTienda" maxLength={12} {...register('appShortName')} error={errors.appShortName?.message} />
            
            <div>
              <label className={styles.selectLabel}>Color del Tema (Barra Superior)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" {...register('themeColor')} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                <Input {...register('themeColor')} style={{ width: '100px' }} />
              </div>
            </div>

            <div>
              <label className={styles.selectLabel}>Color de Fondo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" {...register('backgroundColor')} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                <Input {...register('backgroundColor')} style={{ width: '100px' }} />
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Input label="URL del Ícono (192x192px min)" placeholder="/favicon.svg" {...register('iconUrl')} />
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Save Bar */}
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
          {mutation.isPending ? 'Guardando...' : 'Guardar PWA'}
        </Button>
      </div>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Download size={18} /> Instalación Manual</h3>
        </header>
        
        <div className={styles.cardBody}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '16px' }}>
            <div style={{ background: '#06b6d4', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Smartphone size={16} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Instalar en este dispositivo</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Podés instalar la app ahora mismo con el botón de abajo. Los cambios de arriba aplicarán a nuevas instalaciones.</p>
            </div>
          </div>

          <Button type="button" variant="primary" icon={<Download size={16} />} style={{ background: '#3b82f6', marginBottom: '24px' }} onClick={handleInstallClick} disabled={!deferredPrompt}>
            {deferredPrompt ? 'Instalar App' : 'App ya instalada o no soportada'}
          </Button>

          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
              Android — Google Chrome
            </div>
            <div style={{ padding: '20px' }}>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8' }}>
                <li>Abrí el sitio web en <strong>Google Chrome</strong></li>
                <li>Tocá el ícono de <strong>3 puntos</strong> arriba a la derecha</li>
                <li>Seleccioná "<strong>Agregar a pantalla de inicio</strong>" o "<strong>Instalar app</strong>"</li>
                <li>Confirmá la instalación</li>
              </ol>
            </div>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
              iPhone / iPad — Safari
            </div>
            <div style={{ padding: '20px' }}>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8' }}>
                <li>Abrí el sitio web en <strong>Safari</strong></li>
                <li>Tocá el ícono de <strong>Compartir</strong> en la barra inferior</li>
                <li>Seleccioná "<strong>Agregar a pantalla de inicio</strong>"</li>
                <li>Confirmá tocando <strong>Agregar</strong></li>
              </ol>
            </div>
          </div>
        </div>
      </section>

    </form>
  );
}
