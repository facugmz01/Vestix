import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider, ToggleSwitch } from './SettingsLayout';
import { Input, Button } from '@/components/ui';
import { SystemSettings } from '@/api/settings.api';
import { FileText, Download, ExternalLink, ShieldAlert, Key } from 'lucide-react';
import toast from 'react-hot-toast';

export function ArcaSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  const handleGenerateCsr = () => {
    toast.error('Generación de CSR en desarrollo');
  };

  return (
    <>
      <SettingsSection title="Facturación Electrónica ARCA">
        
        <SettingsRow label="Habilitar facturación electrónica ARCA" hint="Al confirmar una venta de tipo A, B o C se emitirá el comprobante automáticamente. El logo que aparece en la factura se configura en la pestaña Logo.">
          <ToggleSwitch value={!!watch('arca.enabled')} onChange={v => setValue('arca.enabled', v, { shouldDirty: true })} />
        </SettingsRow>

        <SettingsDivider />

        <div className="grid-responsive grid-cols-3" style={{ gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Punto de venta</label>
            <Input type="number" {...register('arca.pointOfSale', { valueAsNumber: true })} />
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Nro. registrado en AFIP. Lo encontrás en <a href="#" style={{ color: 'var(--accent)' }}>AFIP → ARCA / Comprobantes en línea → Datos del punto de venta.</a></p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Ambiente</label>
            <select
              {...register('arca.environment')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="homologation">Homologación (pruebas)</option>
              <option value="production">Producción</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#eab308' }}>⚠️ Usá homologación para pruebas. Producción emite facturas reales.</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Fecha inicio de actividades</label>
            <Input type="date" {...register('arca.startDate')} />
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Se muestra en el encabezado del PDF.</p>
          </div>
        </div>

        <div style={{ marginTop: '24px', width: '33%' }}>
          <Input label="Ingresos Brutos (IIBB)" placeholder="Ej: 30-12345678-9" {...register('arca.iibb')} />
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Si está vacío se usa el CUIT como fallback.</p>
        </div>

        <div style={{ marginTop: '32px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} /> Certificados digitales <span style={{ background: '#eab308', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Pendiente</span>
          </h4>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#3b82f6' }}>ⓘ</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}><strong>CUIT:</strong> — <a href="#" style={{ color: 'var(--accent)' }}>Completá la CUIT en "Datos del comercio" primero.</a></p>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} color="var(--accent)" /> Requisitos previos en AFIP</p>
            </div>
            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Antes de generar el CSR, verificá que el CUIT tenga habilitados los servicios necesarios en AFIP. Solo se hace <strong>una vez</strong>.
              <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Ingresá a <a href="#" style={{ color: 'var(--accent)' }}>auth.afip.gob.ar</a> con <strong>Clave Fiscal nivel 3</strong> o superior.</li>
                <li>Ir a "<strong>Administración de Certificados Digitales</strong>" <br/> Si no lo tenés: <ul style={{ margin: '4px 0' }}><li>Administrador de Relaciones → Adherir servicio</li><li>AFIP → Servicios Interactivos → Administración de Certificados Digitales</li></ul>Allí vas a subir el <code style={{ color: '#ef4444' }}>.csr</code> del Paso 2 y descargar el <code style={{ color: '#ef4444' }}>.crt</code> firmado por AFIP.</li>
                <li><strong>Pero antes de descargar:</strong> Ir a "<strong>Administrador de Relaciones de Clave Fiscal</strong>". Clic en el botón: "<strong>Adherir servicio</strong>"<ul><li>Buscar <strong>ARCA — Web Services</strong> → Facturación Electrónica → <strong>CONFIRMAR</strong></li></ul><span style={{ color: '#ef4444' }}>⚠️ Solo después de vincular el certificado al servicio "Facturación Electrónica" (wsfev1) podés descargarlo. Si lo descargás antes, no va a funcionar.</span></li>
                <li>Por último "<strong>Administrar puntos de venta</strong>"<br/>Debes crear un punto de venta para: "Factura Electrónica - Web Service". El PV de ARCA debe coincidir con el PV guardado en VentaWeb.</li>
              </ol>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#3b82f6', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>1</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Generar clave y solicitud</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Genera la clave privada y el CSR directamente en el servidor, sin instalar nada.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 600 }}>CUIT del emisor</p>
                    <p style={{ margin: 0, fontSize: '14px' }}>— sin configurar —</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Viene de <a href="#" style={{ color: 'var(--accent)' }}>Datos del comercio</a>.</p>
                  </div>
                  <Button style={{ background: '#eab308', color: '#fff', border: 'none', height: '32px' }}>Configurar</Button>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                  <Input label="Alias del certificado *" placeholder="facundogomez" {...register('arca.certAlias')} />
                  <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Este alias es el nombre que vas a escribir en ARCA al agregar el certificado.
                    Usá solo letras, números, guiones o guiones bajos (sin espacios ni tildes).
                  </p>
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', marginTop: '8px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    /CN=facundogomez/serialNumber=CUIT ???
                  </div>
                </div>
                <Button variant="primary" style={{ width: '100%', marginTop: '16px', background: '#3b82f6' }} icon={<Key size={16} />} onClick={handleGenerateCsr}>Generar clave y CSR</Button>
              </div>
            </div>

            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#64748b', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>2</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Subir solicitud a AFIP</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Descargá el archivo <code>.csr</code>, ingresá con clave fiscal a AFIP y subilo en <strong>"Administración de Certificados Digitales"</strong>. AFIP te dará el <code>.crt</code>.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Button variant="outline" disabled style={{ width: '100%', justifyContent: 'center' }} icon={<Download size={14} />}>Descargar .csr</Button>
                  <Button variant="outline" style={{ width: '100%', justifyContent: 'center', color: '#3b82f6', borderColor: '#3b82f6' }} icon={<ExternalLink size={14} />}>Ir al portal AFIP</Button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#64748b', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Subir certificado .crt</span>
              </div>
              <div style={{ padding: '16px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Una vez que AFIP firmó tu solicitud, descargá el <code>.crt</code> y subilo aquí. Debe decir <code>BEGIN CERTIFICATE</code> (no REQUEST).</p>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600 }}>Certificado <code>.crt</code> <span style={{ background: '#ef4444', color: '#fff', fontSize: '9px', padding: '2px 4px', borderRadius: '4px' }}>Falta</span></p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" size="sm">Seleccionar archivo</Button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Sin archivos seleccionados</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Subir clave privada manualmente (avanzado)</p>
          </div>
        </div>

      </SettingsSection>
    </>
  );
}
