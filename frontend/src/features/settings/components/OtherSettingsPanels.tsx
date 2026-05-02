import { Input } from '@/components/ui';
import { settingsApi, type PricingSettings, type SkuBarcodeSettings, type InvoicingSettings, type OfflineSettings } from '@/api/settings.api';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { SettingsSection, SettingsRow, SettingsDivider, ToggleSwitch } from './SettingsLayout';
import { useMutation } from '@tanstack/react-query';
import { TestTube } from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

// ─── Pricing Settings ────────────────────────────────────────────────────────

export function PricingSettingsPanel() {
  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<PricingSettings>({
    key: 'pricing',
    queryFn: () => settingsApi.getSettings().then(d => d.pricing),
    mutateFn: settingsApi.updatePricing,
  });
  const { register, watch, setValue } = form;

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Precios y Descuentos" description="Reglas de redondeo, IVA por defecto y permisos de descuento." onSave={onSubmit} isSaving={isSaving}>

      <SettingsRow label="IVA por Defecto (%)" hint="Se aplicará a productos sin alícuota específica.">
        <Input type="number" min={0} max={100} step={0.01} {...register('vatDefaultPct', { valueAsNumber: true, min: 0, max: 100 })} style={{ width: '120px' }} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Permitir Descuento Manual" hint="Habilita al vendedor a aplicar % de descuento ad hoc en ventas.">
        <ToggleSwitch value={!!watch('allowManualDiscount')} onChange={v => setValue('allowManualDiscount', v)} />
      </SettingsRow>

      <SettingsRow label="Descuento Máximo Permitido (%)" hint="Porcentaje máximo que un vendedor puede aplicar sin autorización.">
        <Input type="number" min={0} max={100} {...register('maxDiscountPct', { valueAsNumber: true })} style={{ width: '120px' }} disabled={!watch('allowManualDiscount')} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Redondeo de Precios" hint="Regla de redondeo al calcular totales.">
        <select {...register('roundingRule')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '220px' }}>
          <option value="NONE">Sin redondeo</option>
          <option value="NEAREST_10">Al $10 más cercano</option>
          <option value="UP">Siempre para arriba</option>
          <option value="DOWN">Siempre para abajo</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Mostrar precios con IVA incluido" hint="Afecta la visualización en POS y catálogo.">
        <ToggleSwitch value={!!watch('showPricesWithTax')} onChange={v => setValue('showPricesWithTax', v)} />
      </SettingsRow>

    </SettingsSection>
  );
}

// ─── SKU / Barcode Settings ──────────────────────────────────────────────────

export function SkuBarcodeSettingsPanel() {
  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<SkuBarcodeSettings>({
    key: 'skuBarcode',
    queryFn: () => settingsApi.getSettings().then(d => d.skuBarcode),
    mutateFn: settingsApi.updateSkuBarcode,
  });
  const { register, watch, setValue } = form;

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="SKU y Códigos de Barra" description="Configuración de generación automática de identificadores de producto." onSave={onSubmit} isSaving={isSaving}>

      <SettingsRow label="Prefijo de SKU" hint="Texto fijo antepuesto a todos los SKUs generados. Ej: 'PROD-'.">
        <Input {...register('skuPrefix')} placeholder="PROD-" style={{ width: '180px' }} />
      </SettingsRow>

      <SettingsRow label="Auto-generar SKU" hint="El sistema genera un SKU único al crear un producto.">
        <ToggleSwitch value={!!watch('skuAutoGenerate')} onChange={v => setValue('skuAutoGenerate', v)} />
      </SettingsRow>

      <SettingsRow label="Próximo Número de Secuencia" hint="El sistema incrementará este valor con cada nuevo SKU.">
        <Input type="number" min={1} {...register('nextSkuSequence', { valueAsNumber: true })} style={{ width: '140px' }} disabled={!watch('skuAutoGenerate')} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Formato de Código de Barra" hint="Formato a utilizar al generar e imprimir códigos.">
        <select {...register('barcodeFormat')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '200px' }}>
          <option value="NONE">Sin código de barra</option>
          <option value="EAN13">EAN-13 (estándar tienda)</option>
          <option value="CODE128">CODE-128 (alfanumérico)</option>
          <option value="QR">QR Code</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Auto-generar Código de Barra" hint="Genera automáticamente un código al crear el SKU.">
        <ToggleSwitch value={!!watch('barcodeAutoGenerate')} onChange={v => setValue('barcodeAutoGenerate', v)} />
      </SettingsRow>

    </SettingsSection>
  );
}

// ─── Invoicing Settings ──────────────────────────────────────────────────────

export function InvoicingSettingsPanel() {
  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<InvoicingSettings>({
    key: 'invoicing',
    queryFn: () => settingsApi.getSettings().then(d => d.invoicing),
    mutateFn: settingsApi.updateInvoicing,
  });
  const { register, watch, setValue } = form;

  const testAfip = useMutation({
    mutationFn: settingsApi.testAfipConnection,
    onSuccess: (d) => d.success ? toast.success(d.message) : toast.error(d.message),
    onError: () => toast.error('Error al conectar con AFIP'),
  });

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Facturación Electrónica (AFIP)" description="Configuración del punto de venta y ambiente fiscal para AFIP." onSave={onSubmit} isSaving={isSaving}>

      <SettingsRow label="Ambiente AFIP">
        <select {...register('afipEnvironment')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '200px' }}>
          <option value="homologation">Homologación (pruebas)</option>
          <option value="production">Producción</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Punto de Venta" hint="Número de punto de venta registrado en AFIP (Ej: 1, 2, 3…).">
        <Input type="number" min={1} {...register('fiscalPointSale', { valueAsNumber: true, required: 'Requerido', min: 1 })} style={{ width: '120px' }} />
      </SettingsRow>

      <SettingsRow label="Tipo de Comprobante por Defecto">
        <select {...register('defaultInvoiceType')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '200px' }}>
          <option value="FACTURA_B">Factura B (consumidor final)</option>
          <option value="FACTURA_A">Factura A (RI a RI)</option>
          <option value="FACTURA_C">Factura C (Monotributista)</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Emitir Automáticamente al Confirmar Venta" hint="Si está activado, la factura se emite junto con la venta.">
        <ToggleSwitch value={!!watch('autoIssueOnSale')} onChange={v => setValue('autoIssueOnSale', v)} />
      </SettingsRow>

      <SettingsRow label="Texto de Pie de Factura">
        <textarea
          rows={3}
          {...register('invoiceFooterText')}
          placeholder="Ej: Gracias por su compra. No se aceptan devoluciones..."
          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', resize: 'vertical' }}
        />
      </SettingsRow>

      <SettingsDivider />

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outline" icon={<TestTube size={14} />} onClick={() => testAfip.mutate()} loading={testAfip.isPending}>
          Probar Conexión AFIP
        </Button>
      </div>

    </SettingsSection>
  );
}

// ─── Offline Settings ────────────────────────────────────────────────────────

export function OfflineSettingsPanel() {
  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<OfflineSettings>({
    key: 'offline',
    queryFn: () => settingsApi.getSettings().then(d => d.offline),
    mutateFn: settingsApi.updateOffline,
  });
  const { register, watch, setValue } = form;

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Modo Offline" description="Comportamiento del sistema cuando no hay conexión a internet." onSave={onSubmit} isSaving={isSaving}>

      <SettingsRow label="Modo Offline Habilitado" hint="Permite operar el POS sin conexión. Las operaciones se encolan y sincronizan al reconectarse.">
        <ToggleSwitch value={!!watch('offlineModeEnabled')} onChange={v => setValue('offlineModeEnabled', v)} />
      </SettingsRow>

      <SettingsRow label="TTL Offline POS (horas)" hint="Tiempo máximo que el POS puede operar sin conexión antes de requerir re-autenticación.">
        <Input type="number" min={1} max={48} {...register('posOfflineTtlHours', { valueAsNumber: true })} style={{ width: '100px' }} disabled={!watch('offlineModeEnabled')} />
      </SettingsRow>

      <SettingsRow label="Máximo de Operaciones en Cola" hint="Si se supera este límite, el sistema bloquea nuevas operaciones hasta sincronizar.">
        <Input type="number" min={1} max={500} {...register('maxQueueSize', { valueAsNumber: true })} style={{ width: '100px' }} disabled={!watch('offlineModeEnabled')} />
      </SettingsRow>

      <SettingsRow label="Sincronizar Automáticamente al Reconectarse">
        <ToggleSwitch value={!!watch('autoSyncOnReconnect')} onChange={v => setValue('autoSyncOnReconnect', v)} disabled={!watch('offlineModeEnabled')} />
      </SettingsRow>

      <SettingsRow label="Estrategia ante Conflictos" hint="Qué hace el sistema si un dato cambia tanto offline como en el servidor.">
        <select {...register('conflictStrategy')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '240px' }} disabled={!watch('offlineModeEnabled')}>
          <option value="ASK_USER">Preguntar al operador</option>
          <option value="SERVER_WINS">El servidor gana siempre</option>
          <option value="CLIENT_WINS">El cliente gana siempre</option>
        </select>
      </SettingsRow>

    </SettingsSection>
  );
}
