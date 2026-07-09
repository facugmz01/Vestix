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

          <hr className={styles.divider} />

          <div className={clsx(styles.grid, styles.gridAutoFit)}>
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

          <div className={styles.constrainedFieldSm}>
            <Input label="Ingresos Brutos (IIBB)" placeholder="Ej: 30-12345678-9" {...register('iibb')} />
          </div>

          <hr className={styles.divider} />

          <h4 className={styles.subsectionTitle}>
            <ShieldAlert size={16} /> Certificados digitales <span className={styles.statusBadge}>Pendiente</span>
          </h4>

          <div className={styles.infoBox}>
            <span className={styles.infoBoxIcon}>ⓘ</span>
            <p className={styles.infoBoxBody}><strong>CUIT:</strong> — Completá la CUIT en Datos del comercio primero.</p>
          </div>

          <div className={styles.nestedCard}>
            <div className={styles.nestedCardHeader}>
              <p className={styles.nestedCardHeaderTitle}><FileText size={14} color="var(--accent)" /> Requisitos previos en AFIP</p>
            </div>
            <div className={styles.nestedCardBody}>
              Antes de generar el CSR, verificá tener <strong>Clave Fiscal nivel 3</strong> y "Administración de Certificados Digitales" habilitado en auth.afip.gob.ar.
            </div>
          </div>

          <div className={clsx(styles.grid, styles.gridAutoFitWide)}>
            <div className={styles.wizardCard}>
              <div className={styles.stepCardHeaderPrimary}>
                <span className={styles.stepCardHeaderLabel}>1. Generar clave y solicitud</span>
              </div>
              <div className={styles.wizardCardBody}>
                <Input label="Alias del certificado *" placeholder="facundogomez" {...register('certAlias')} />
                <Button variant="primary" className={clsx(styles.btnFullWidthMt, styles.btnAccent)} icon={<Key size={16} />} onClick={handleGenerateCsr}>Generar clave y CSR</Button>
              </div>
            </div>

            <div className={styles.wizardCard}>
              <div className={styles.stepCardHeaderMuted}>
                <span className={styles.stepCardHeaderLabel}>2. Subir solicitud a AFIP</span>
              </div>
              <div className={styles.stepCardActions}>
                <Button variant="outline" disabled className={styles.btnCentered} icon={<Download size={14} />}>Descargar .csr</Button>
                <Button variant="outline" className={clsx(styles.btnCentered, styles.btnAccentOutline)} icon={<ExternalLink size={14} />}>Ir al portal AFIP</Button>
              </div>
            </div>

            <div className={styles.wizardCard}>
              <div className={styles.stepCardHeaderMuted}>
                <span className={styles.stepCardHeaderLabel}>3. Subir certificado .crt</span>
              </div>
              <div className={styles.wizardCardBody}>
                <div className={styles.filePickerRow}>
                  <Button variant="outline" size="sm">Seleccionar archivo</Button>
                  <span className={styles.filePickerHint}>Sin archivos seleccionados</span>
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
