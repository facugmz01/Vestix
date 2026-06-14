import { Input } from '@/components/ui';
import { SystemSettings } from '@/api/settings.api';
import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider, ToggleSwitch } from './SettingsLayout';
import { useMutation } from '@tanstack/react-query';
import { TestTube } from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

// ─── Pricing Settings ────────────────────────────────────────────────────────

export function PricingSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  return (
    <SettingsSection title="Precios y Descuentos" description="Reglas de redondeo, IVA por defecto y permisos de descuento.">

      <SettingsRow label="IVA por Defecto (%)" hint="Se aplicará a productos sin alícuota específica.">
        <Input type="number" min={0} max={100} step={0.01} {...register('pricing.vatDefaultPct', { valueAsNumber: true, min: 0, max: 100 })} style={{ width: '120px' }} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Permitir Descuento Manual" hint="Habilita al vendedor a aplicar % de descuento ad hoc en ventas.">
        <ToggleSwitch value={!!watch('pricing.allowManualDiscount')} onChange={v => setValue('pricing.allowManualDiscount', v, { shouldDirty: true })} />
      </SettingsRow>

      <SettingsRow label="Descuento Máximo Permitido (%)" hint="Porcentaje máximo que un vendedor puede aplicar sin autorización.">
        <Input type="number" min={0} max={100} {...register('pricing.maxDiscountPct', { valueAsNumber: true })} style={{ width: '120px' }} disabled={!watch('pricing.allowManualDiscount')} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Redondeo de Precios" hint="Regla de redondeo al calcular totales.">
        <select {...register('pricing.roundingRule')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '220px' }}>
          <option value="NONE">Sin redondeo</option>
          <option value="NEAREST_10">Al $10 más cercano</option>
          <option value="UP">Siempre para arriba</option>
          <option value="DOWN">Siempre para abajo</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Mostrar precios con IVA incluido" hint="Afecta la visualización en POS y catálogo.">
        <ToggleSwitch value={!!watch('pricing.showPricesWithTax')} onChange={v => setValue('pricing.showPricesWithTax', v, { shouldDirty: true })} />
      </SettingsRow>

    </SettingsSection>
  );
}

// ─── SKU / Barcode Settings ──────────────────────────────────────────────────

export function SkuBarcodeSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  return (
    <SettingsSection title="SKU y Códigos de Barra" description="Configuración de generación automática de identificadores de producto.">

      <SettingsRow label="Prefijo de SKU" hint="Texto fijo antepuesto a todos los SKUs generados. Ej: 'PROD-'.">
        <Input {...register('skuBarcode.skuPrefix')} placeholder="PROD-" style={{ width: '180px' }} />
      </SettingsRow>

      <SettingsRow label="Auto-generar SKU" hint="El sistema genera un SKU único al crear un producto.">
        <ToggleSwitch value={!!watch('skuBarcode.skuAutoGenerate')} onChange={v => setValue('skuBarcode.skuAutoGenerate', v, { shouldDirty: true })} />
      </SettingsRow>

      <SettingsRow label="Próximo Número de Secuencia" hint="El sistema incrementará este valor con cada nuevo SKU.">
        <Input type="number" min={1} {...register('skuBarcode.nextSkuSequence', { valueAsNumber: true })} style={{ width: '140px' }} disabled={!watch('skuBarcode.skuAutoGenerate')} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Formato de Código de Barra" hint="Formato a utilizar al generar e imprimir códigos.">
        <select {...register('skuBarcode.barcodeFormat')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '200px' }}>
          <option value="NONE">Sin código de barra</option>
          <option value="EAN13">EAN-13 (estándar tienda)</option>
          <option value="CODE128">CODE-128 (alfanumérico)</option>
          <option value="QR">QR Code</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Auto-generar Código de Barra" hint="Genera automáticamente un código al crear el SKU.">
        <ToggleSwitch value={!!watch('skuBarcode.barcodeAutoGenerate')} onChange={v => setValue('skuBarcode.barcodeAutoGenerate', v, { shouldDirty: true })} />
      </SettingsRow>

    </SettingsSection>
  );
}

// ─── Invoicing Settings ──────────────────────────────────────────────────────

import { settingsApi } from '@/api/settings.api';

export function InvoicingSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  const testAfip = useMutation({
    mutationFn: settingsApi.testAfip,
    onSuccess: (d) => d.success ? toast.success(d.message) : toast.error(d.message),
    onError: () => toast.error('Error al conectar con AFIP'),
  });

  return (
    <SettingsSection title="Facturación Electrónica (AFIP)" description="Configuración del punto de venta y ambiente fiscal para AFIP.">

      <SettingsRow label="Ambiente AFIP">
        <select {...register('invoicing.afipEnvironment')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '200px' }}>
          <option value="homologation">Homologación (pruebas)</option>
          <option value="production">Producción</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Punto de Venta" hint="Número de punto de venta registrado en AFIP (Ej: 1, 2, 3…).">
        <Input type="number" min={1} {...register('invoicing.fiscalPointSale', { valueAsNumber: true, required: 'Requerido', min: 1 })} style={{ width: '120px' }} />
      </SettingsRow>

      <SettingsRow label="Tipo de Comprobante por Defecto">
        <select {...register('invoicing.defaultInvoiceType')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '200px' }}>
          <option value="FACTURA_B">Factura B (consumidor final)</option>
          <option value="FACTURA_A">Factura A (RI a RI)</option>
          <option value="FACTURA_C">Factura C (Monotributista)</option>
        </select>
      </SettingsRow>

      <SettingsRow label="Emitir Automáticamente al Confirmar Venta" hint="Si está activado, la factura se emite junto con la venta.">
        <ToggleSwitch value={!!watch('invoicing.autoIssueOnSale')} onChange={v => setValue('invoicing.autoIssueOnSale', v, { shouldDirty: true })} />
      </SettingsRow>

      <SettingsRow label="Texto de Pie de Factura">
        <textarea
          rows={3}
          {...register('invoicing.invoiceFooterText')}
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
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  return (
    <SettingsSection title="Modo Offline" description="Comportamiento del sistema cuando no hay conexión a internet.">

      <SettingsRow label="Modo Offline Habilitado" hint="Permite operar el POS sin conexión. Las operaciones se encolan y sincronizan al reconectarse.">
        <ToggleSwitch value={!!watch('offline.offlineModeEnabled')} onChange={v => setValue('offline.offlineModeEnabled', v, { shouldDirty: true })} />
      </SettingsRow>

      <SettingsRow label="TTL Offline POS (horas)" hint="Tiempo máximo que el POS puede operar sin conexión antes de requerir re-autenticación.">
        <Input type="number" min={1} max={48} {...register('offline.posOfflineTtlHours', { valueAsNumber: true })} style={{ width: '100px' }} disabled={!watch('offline.offlineModeEnabled')} />
      </SettingsRow>

      <SettingsRow label="Máximo de Operaciones en Cola" hint="Si se supera este límite, el sistema bloquea nuevas operaciones hasta sincronizar.">
        <Input type="number" min={1} max={500} {...register('offline.maxQueueSize', { valueAsNumber: true })} style={{ width: '100px' }} disabled={!watch('offline.offlineModeEnabled')} />
      </SettingsRow>

      <SettingsRow label="Sincronizar Automáticamente al Reconectarse">
        <ToggleSwitch value={!!watch('offline.autoSyncOnReconnect')} onChange={v => setValue('offline.autoSyncOnReconnect', v, { shouldDirty: true })} disabled={!watch('offline.offlineModeEnabled')} />
      </SettingsRow>

      <SettingsRow label="Estrategia ante Conflictos" hint="Qué hace el sistema si un dato cambia tanto offline como en el servidor.">
        <select {...register('offline.conflictStrategy')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '240px' }} disabled={!watch('offline.offlineModeEnabled')}>
          <option value="ASK_USER">Preguntar al operador</option>
          <option value="SERVER_WINS">El servidor gana siempre</option>
          <option value="CLIENT_WINS">El cliente gana siempre</option>
        </select>
      </SettingsRow>

    </SettingsSection>
  );
}
