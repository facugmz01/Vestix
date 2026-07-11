import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, FileText, Download, ExternalLink, ShieldAlert, Key, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { arcaSettingsSchema, type ArcaSettingsFormData } from '../schemas/arcaSettings.schema';
import { settingsApi } from '@/api/settings.api';
import clsx from 'clsx';
import styles from './SettingsShared.module.css';

const AFIP_CERT_PORTAL_URL = 'https://auth.afip.gob.ar/contribuyente_/login.xhtml';

export function ArcaSettingsPanel() {
  const { data: settings, isLoading, refetch } = useGetSettings();
  const mutation = useUpdateSettingsSection('arca');
  const certInputRef = useRef<HTMLInputElement>(null);

  const [generatingCsr, setGeneratingCsr] = useState(false);
  const [downloadingCsr, setDownloadingCsr] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<ArcaSettingsFormData>({
    resolver: zodResolver(arcaSettingsSchema),
  });

  const certAlias = watch('certAlias');
  const cuit = watch('cuit');

  useEffect(() => {
    if (settings?.arca) reset(settings.arca);
  }, [settings, reset]);

  const onSubmit = (data: ArcaSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const handleGenerateCsr = async () => {
    if (!certAlias?.trim()) {
      toast.error('Ingresá un alias de certificado');
      return;
    }
    if (!cuit?.trim()) {
      toast.error('Ingresá el CUIT antes de generar el CSR');
      return;
    }

    setGeneratingCsr(true);
    try {
      const result = await settingsApi.generateArcaCsr({
        certAlias: certAlias.trim(),
        cuit: cuit.trim(),
        organizationName: settings?.general?.companyName,
      });
      toast.success(`Clave y CSR generados para "${result.certAlias}"`);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo generar el CSR');
    } finally {
      setGeneratingCsr(false);
    }
  };

  const handleDownloadCsr = async () => {
    if (!certAlias?.trim()) {
      toast.error('No hay alias de certificado configurado');
      return;
    }

    setDownloadingCsr(true);
    try {
      await settingsApi.downloadArcaCsr(`${certAlias.trim()}.csr`);
      toast.success('CSR descargado');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo descargar el CSR');
    } finally {
      setDownloadingCsr(false);
    }
  };

  const handleCertFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!certAlias?.trim()) {
      toast.error('Configurá y guardá un alias de certificado antes de subir el .crt');
      event.target.value = '';
      return;
    }

    setUploadingCert(true);
    try {
      const result = await settingsApi.uploadArcaCert(file);
      toast.success(`Certificado subido para "${result.certAlias}"`);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo subir el certificado');
    } finally {
      setUploadingCert(false);
      event.target.value = '';
    }
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

          <div className={clsx(styles.grid, styles.gridAutoFit)}>
            <Input label="CUIT" placeholder="Ej: 20-12345678-9" {...register('cuit')} error={errors.cuit?.message} />
            <div className={styles.constrainedFieldSm}>
              <Input label="Ingresos Brutos (IIBB)" placeholder="Ej: 30-12345678-9" {...register('iibb')} />
            </div>
          </div>

          <hr className={styles.divider} />

          <h4 className={styles.subsectionTitle}>
            <ShieldAlert size={16} /> Certificados digitales
          </h4>

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
                <Input
                  label="Alias del certificado *"
                  placeholder="facundogomez"
                  helperText="Solo letras, números, guiones y guiones bajos"
                  {...register('certAlias')}
                />
                <Button
                  variant="primary"
                  type="button"
                  loading={generatingCsr}
                  disabled={generatingCsr}
                  onClick={handleGenerateCsr}
                  className={clsx(styles.btnFullWidthMt, styles.btnAccent)}
                  icon={<Key size={16} />}
                >
                  Generar clave y CSR
                </Button>
              </div>
            </div>

            <div className={styles.wizardCard}>
              <div className={styles.stepCardHeaderMuted}>
                <span className={styles.stepCardHeaderLabel}>2. Subir solicitud a AFIP</span>
              </div>
              <div className={styles.stepCardActions}>
                <Button
                  variant="outline"
                  type="button"
                  loading={downloadingCsr}
                  disabled={downloadingCsr || !certAlias?.trim()}
                  onClick={handleDownloadCsr}
                  className={styles.btnCentered}
                  icon={<Download size={14} />}
                >
                  Descargar .csr
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className={clsx(styles.btnCentered, styles.btnAccentOutline)}
                  icon={<ExternalLink size={14} />}
                  onClick={() => window.open(AFIP_CERT_PORTAL_URL, '_blank', 'noopener,noreferrer')}
                >
                  Ir al portal AFIP
                </Button>
              </div>
            </div>

            <div className={styles.wizardCard}>
              <div className={styles.stepCardHeaderMuted}>
                <span className={styles.stepCardHeaderLabel}>3. Subir certificado .crt</span>
              </div>
              <div className={styles.wizardCardBody}>
                <input
                  ref={certInputRef}
                  type="file"
                  accept=".crt"
                  style={{ display: 'none' }}
                  onChange={handleCertFileChange}
                />
                <div className={styles.filePickerRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    loading={uploadingCert}
                    disabled={uploadingCert || !certAlias?.trim()}
                    icon={<Upload size={14} />}
                    onClick={() => certInputRef.current?.click()}
                  >
                    Seleccionar archivo
                  </Button>
                  <span className={styles.filePickerHint}>
                    {certAlias?.trim()
                      ? `Se guardará como uploads/arca/${certAlias.trim()}.crt`
                      : 'Configurá un alias antes de subir'}
                  </span>
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
