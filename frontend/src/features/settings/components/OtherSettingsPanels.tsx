import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Tag, Barcode, WifiOff, FileText, AlertTriangle } from 'lucide-react';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { invoicingSettingsSchema, type InvoicingSettingsFormData } from '../schemas/invoicingSettings.schema';
import { pricingSettingsSchema, type PricingSettingsFormData, skuBarcodeSettingsSchema, type SkuBarcodeSettingsFormData, offlineSettingsSchema, type OfflineSettingsFormData } from '../schemas/otherSettings.schema';
import clsx from 'clsx';
import styles from './SettingsShared.module.css';

// ─── Pricing Settings ────────────────────────────────────────────────────────
export function PricingSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('pricing');

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<PricingSettingsFormData>({ resolver: zodResolver(pricingSettingsSchema) });

  useEffect(() => { if (settings?.pricing) reset(settings.pricing); }, [settings, reset]);
  const onSubmit = (data: PricingSettingsFormData) => mutation.mutate(data, { onSuccess: () => reset(data) });

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Tag size={18} /> Precios y Descuentos</h3>
          <p className={styles.cardDescription}>Reglas de redondeo, IVA por defecto y permisos de descuento.</p>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.grid}>
            <Input type="number" label="IVA por Defecto (%)" {...register('vatDefaultPct', { valueAsNumber: true })} />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <ToggleSwitch label="Permitir Descuento Manual" {...register('allowManualDiscount')} />
            <Input type="number" label="Descuento Máximo Permitido (%)" {...register('maxDiscountPct', { valueAsNumber: true })} />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Redondeo de Precios</label>
              <select {...register('roundingRule')} className={styles.select}>
                <option value="NONE">Sin redondeo</option>
                <option value="NEAREST_10">Al $10 más cercano</option>
                <option value="UP">Siempre para arriba</option>
                <option value="DOWN">Siempre para abajo</option>
              </select>
            </div>
            <ToggleSwitch label="Mostrar precios con IVA incluido" {...register('showPricesWithTax')} />
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Precios'}
        </Button>
      </div>
    </form>
  );
}

// ─── SKU / Barcode Settings ──────────────────────────────────────────────────
export function SkuBarcodeSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('skuBarcode');
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<SkuBarcodeSettingsFormData>({ resolver: zodResolver(skuBarcodeSettingsSchema) });

  useEffect(() => { if (settings?.skuBarcode) reset(settings.skuBarcode); }, [settings, reset]);
  const onSubmit = (data: SkuBarcodeSettingsFormData) => mutation.mutate(data, { onSuccess: () => reset(data) });

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Barcode size={18} /> SKU y Códigos de Barra</h3>
          <p className={styles.cardDescription}>Configuración de generación automática.</p>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.grid}>
            <Input label="Prefijo de SKU" placeholder="PROD-" {...register('skuPrefix')} />
            <ToggleSwitch label="Auto-generar SKU" {...register('skuAutoGenerate')} />
            <Input type="number" label="Próximo Número Secuencia" {...register('nextSkuSequence', { valueAsNumber: true })} />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Formato de Código de Barra</label>
              <select {...register('barcodeFormat')} className={styles.select}>
                <option value="NONE">Sin código de barra</option>
                <option value="EAN13">EAN-13 (estándar tienda)</option>
                <option value="CODE128">CODE-128 (alfanumérico)</option>
                <option value="QR">QR Code</option>
              </select>
            </div>
            <ToggleSwitch label="Auto-generar Código de Barra" {...register('barcodeAutoGenerate')} />
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
          {mutation.isPending ? 'Guardando...' : 'Guardar SKU y Códigos'}
        </Button>
      </div>
    </form>
  );
}

// ─── Invoicing Settings ──────────────────────────────────────────────────────
export function InvoicingSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('invoicing');
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<InvoicingSettingsFormData>({ resolver: zodResolver(invoicingSettingsSchema) });

  useEffect(() => { if (settings?.invoicing) reset(settings.invoicing); }, [settings, reset]);
  const onSubmit = (data: InvoicingSettingsFormData) => mutation.mutate(data, { onSuccess: () => reset(data) });

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><FileText size={18} /> Configuración fiscal</h3>
          <p className={styles.cardDescription}>Define tu situación impositiva.</p>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.grid}>
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Condición frente al IVA</label>
              <select {...register('defaultInvoiceType')} className={styles.select}>
                <option value="FACTURA_B">Responsable Inscripto</option>
                <option value="FACTURA_C">Monotributo</option>
                <option value="EXENTO">Sujeto Exento</option>
              </select>
            </div>
            
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '12px 16px', borderRadius: '8px', display: 'flex', gap: '8px' }}>
              <AlertTriangle size={16} color="#eab308" />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Requiere cargar certificados AFIP.</p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            <ToggleSwitch 
              label="Ventas sin comprobante fiscal" 
              hint="Ideal para presupuestos o control de caja."
              {...register('autoIssueOnSale')} 
            />
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Configuración Fiscal'}
        </Button>
      </div>
    </form>
  );
}

// ─── Offline Settings ────────────────────────────────────────────────────────
export function OfflineSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('offline');
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OfflineSettingsFormData>({ resolver: zodResolver(offlineSettingsSchema) });

  useEffect(() => { if (settings?.offline) reset(settings.offline); }, [settings, reset]);
  const onSubmit = (data: OfflineSettingsFormData) => mutation.mutate(data, { onSuccess: () => reset(data) });

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><WifiOff size={18} /> Modo Offline</h3>
          <p className={styles.cardDescription}>Comportamiento sin internet.</p>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.grid}>
            <ToggleSwitch label="Modo Offline Habilitado" {...register('offlineModeEnabled')} />
            <Input type="number" label="TTL Offline POS (horas)" {...register('posOfflineTtlHours', { valueAsNumber: true })} />
            <Input type="number" label="Máximo de Operaciones en Cola" {...register('maxQueueSize', { valueAsNumber: true })} />
            <ToggleSwitch label="Sincronizar Automáticamente al Reconectarse" {...register('autoSyncOnReconnect')} />
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Estrategia ante Conflictos</label>
              <select {...register('conflictStrategy')} className={styles.select}>
                <option value="ASK_USER">Preguntar al operador</option>
                <option value="SERVER_WINS">El servidor gana siempre</option>
                <option value="CLIENT_WINS">El cliente gana siempre</option>
              </select>
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Modo Offline'}
        </Button>
      </div>
    </form>
  );
}
