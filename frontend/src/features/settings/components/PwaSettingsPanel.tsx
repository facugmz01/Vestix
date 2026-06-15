import { SettingsSection } from './SettingsLayout';
import { Button } from '@/components/ui';
import { Download, Info } from 'lucide-react';

export function PwaSettingsPanel() {
  return (
    <SettingsSection title="App móvil / PWA">
      
      <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '16px' }}>
        <div style={{ background: '#06b6d4', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Info size={16} />
        </div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Lista para instalar</h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Podés instalar VentaWeb como app con el botón de abajo.</p>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>Tu dispositivo está listo para instalar VentaWeb como aplicación.</p>
      
      <Button variant="primary" icon={<Download size={16} />} style={{ background: '#3b82f6', marginBottom: '32px' }}>
        Instalar VentaWeb
      </Button>

      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
          Android — Google Chrome
        </div>
        <div style={{ padding: '20px' }}>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8' }}>
            <li>Abrí VentaWeb en <strong>Google Chrome</strong></li>
            <li>Tocá el ícono de <strong>3 puntos</strong> arriba a la derecha</li>
            <li>Seleccioná "<strong>Agregar a pantalla de inicio</strong>" o "<strong>Instalar app</strong>"</li>
            <li>Confirmá la instalación</li>
          </ol>
          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '12px', borderRadius: '8px', marginTop: '16px', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#06b6d4' }}>ⓘ</span>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>También podés usar VentaWeb directamente desde Chrome sin instalarla — funciona igual.</p>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
          iPhone / iPad — Safari
        </div>
        <div style={{ padding: '20px' }}>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8' }}>
            <li>Abrí VentaWeb en <strong>Safari</strong> (no Chrome ni Firefox)</li>
            <li>Tocá el ícono de <strong>Compartir</strong> <span style={{ border: '1px solid var(--border)', borderRadius: '4px', padding: '0 4px', fontSize: '11px' }}>↑</span> en la barra inferior</li>
            <li>Seleccioná "<strong>Agregar a pantalla de inicio</strong>"</li>
            <li>Confirmá tocando <strong>Agregar</strong></li>
          </ol>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
          PC / Mac — Chrome o Edge
        </div>
        <div style={{ padding: '20px' }}>
          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.8' }}>
            <li>Abrí VentaWeb en <strong>Chrome o Edge</strong></li>
            <li>Buscá el ícono de instalación en la barra de direcciones (junto al candado)</li>
            <li>Hacé clic en "<strong>Instalar VentaWeb</strong>"</li>
          </ol>
        </div>
      </div>

    </SettingsSection>
  );
}
