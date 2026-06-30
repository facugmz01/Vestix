import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, FileText, Download, ExternalLink, ShieldAlert, Key } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { arcaSettingsSchema, type ArcaSettingsFormData } from '../schemas/arcaSettings.schema';
import clsx from 'clsx';
import styles from './SettingsShared.module.css';

export function ArcaSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('arca');

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ArcaSettingsFormData>({
    resolver: zodResolver(arcaSettingsSchema),
  });

  useEffect(() => {
    if (settings?.arca) reset(settings.arca);
  }, [settings, reset]);

  const onSubmit = (data: ArcaSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const handleGenerateCsr = () => {
    toast.error('Generación de CSR en desarrollo');
  };

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><FileText size={18} /> Facturación Electrónica ARCA</h3>
          <p className={styles.cardDescription}>Conexión con los web services de AFIP.</p>
        </header>

        <div className={styles.cardBody}>
          <ToggleSwitch 
            label="Habilitar facturación electrónica ARCA" 
            hint="Emite el comprobante automáticamente al confirmar ventas." 
            {...register('enabled')} 
          />

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <Input type="number" label="Punto de venta" helperText="Registrado en AFIP" {...register('pointOfSale', { valueAsNumber: true })} />
            
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Ambiente</label>
              <select {...register('environment')} className={styles.select}>
                <option value="homologation">Homologación (pruebas)</option>
                <option value="production">Producción</option>
              </select>
            </div>
            
            <Input type="date" label="Inicio actividades" {...register('startDate')} />
          </div>

          <div style={{ marginTop: '16px', maxWidth: '300px' }}>
            <Input label="Ingresos Brutos (IIBB)" placeholder="Ej: 30-12345678-9" {...register('iibb')} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} /> Certificados digitales <span style={{ background: '#eab308', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>Pendiente</span>
          </h4>

          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#3b82f6' }}>ⓘ</span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}><strong>CUIT:</strong> — Completá la CUIT en Datos del comercio primero.</p>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} color="var(--accent)" /> Requisitos previos en AFIP</p>
            </div>
            <div style={{ padding: '16px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Antes de generar el CSR, verificá tener <strong>Clave Fiscal nivel 3</strong> y "Administración de Certificados Digitales" habilitado en auth.afip.gob.ar.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#3b82f6', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>1. Generar clave y solicitud</span>
              </div>
              <div style={{ padding: '16px' }}>
                <Input label="Alias del certificado *" placeholder="facundogomez" {...register('certAlias')} />
                <Button variant="primary" style={{ width: '100%', marginTop: '16px', background: '#3b82f6' }} icon={<Key size={16} />} onClick={handleGenerateCsr}>Generar clave y CSR</Button>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#64748b', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>2. Subir solicitud a AFIP</span>
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Button variant="outline" disabled style={{ width: '100%', justifyContent: 'center' }} icon={<Download size={14} />}>Descargar .csr</Button>
                <Button variant="outline" style={{ width: '100%', justifyContent: 'center', color: '#3b82f6', borderColor: '#3b82f6' }} icon={<ExternalLink size={14} />}>Ir al portal AFIP</Button>
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#64748b', color: '#fff', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>3. Subir certificado .crt</span>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="outline" size="sm">Seleccionar archivo</Button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', alignSelf: 'center' }}>Sin archivos seleccionados</span>
                </div>
              </div>
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Configuración ARCA'}
        </Button>
      </div>
    </form>
  );
}
