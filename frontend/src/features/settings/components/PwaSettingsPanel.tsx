import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsDivider } from './SettingsLayout';
import { Button, Input } from '@/components/ui';
import { Download, Info, Smartphone } from 'lucide-react';
import { SystemSettings } from '@/api/settings.api';

export function PwaSettingsPanel() {
  const { register } = useFormContext<SystemSettings>();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  return (
    <SettingsSection title="App móvil / PWA" description="Configura cómo se verá tu Tienda y ERP cuando los usuarios la instalen en sus dispositivos.">
      
      <div className="grid-responsive grid-cols-2">
        <Input label="Nombre de la App *" placeholder="Ej: Mi Tienda Online" {...register('pwa.appName')} />
        <Input label="Nombre Corto *" placeholder="Ej: MiTienda (max 12 letras)" maxLength={12} {...register('pwa.appShortName')} />
        
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Color del Tema (Barra Superior)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="color" {...register('pwa.themeColor')} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
            <Input {...register('pwa.themeColor')} placeholder="#3b82f6" style={{ width: '100px' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Color de Fondo (Pantalla de carga)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="color" {...register('pwa.backgroundColor')} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
            <Input {...register('pwa.backgroundColor')} placeholder="#ffffff" style={{ width: '100px' }} />
          </div>
        </div>

        <Input label="URL del Ícono (192x192px min)" placeholder="/favicon.svg" {...register('pwa.iconUrl')} style={{ gridColumn: '1 / -1' }} />
      </div>

      <SettingsDivider />

      <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div style={{ background: '#06b6d4', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Smartphone size={16} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Instalar en este dispositivo</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Podés instalar la app ahora mismo con el botón de abajo. Los cambios de arriba aplicarán a nuevas instalaciones.</p>
        </div>
      </div>

      <Button 
        variant="primary" 
        icon={<Download size={16} />} 
        style={{ background: '#3b82f6', marginBottom: '32px' }}
        onClick={handleInstallClick}
        disabled={!deferredPrompt}
      >
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

      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
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
    </SettingsSection>
  );
}
