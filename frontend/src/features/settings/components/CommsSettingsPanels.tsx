import { settingsApi, type NotificationSettings, type IntegrationSettings } from '@/api/settings.api';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { SettingsSection, SettingsRow, SettingsDivider, ToggleSwitch } from './SettingsLayout';
import { Input } from '@/components/ui';

// ─── Notification Settings ───────────────────────────────────────────────────

export function NotificationSettingsPanel() {
  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<NotificationSettings>({
    key: 'notifications',
    queryFn: () => settingsApi.getSettings().then(d => d.notifications),
    mutateFn: settingsApi.updateNotifications,
  });
  const { register, watch, setValue } = form;

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Notificaciones" description="Canales de comunicación habilitados y reglas de disparo automático." onSave={onSubmit} isSaving={isSaving}>

      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Canales habilitados</p>

      <SettingsRow label="Email" hint="Requiere configurar Sendgrid en Integraciones.">
        <ToggleSwitch value={!!watch('emailEnabled')} onChange={v => setValue('emailEnabled', v)} />
      </SettingsRow>
      <SettingsRow label="SMS" hint="Requiere configurar Twilio en Integraciones.">
        <ToggleSwitch value={!!watch('smsEnabled')} onChange={v => setValue('smsEnabled', v)} />
      </SettingsRow>
      <SettingsRow label="WhatsApp" hint="Requiere configurar WhatsApp Business en Integraciones.">
        <ToggleSwitch value={!!watch('whatsappEnabled')} onChange={v => setValue('whatsappEnabled', v)} />
      </SettingsRow>
      <SettingsRow label="Push (App Móvil)">
        <ToggleSwitch value={!!watch('pushEnabled')} onChange={v => setValue('pushEnabled', v)} />
      </SettingsRow>

      <SettingsDivider />

      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Eventos que disparan notificaciones</p>

      <SettingsRow label="Venta Confirmada">
        <ToggleSwitch value={!!watch('notifyOnSale')} onChange={v => setValue('notifyOnSale', v)} />
      </SettingsRow>
      <SettingsRow label="Orden de Compra Emitida">
        <ToggleSwitch value={!!watch('notifyOnPurchase')} onChange={v => setValue('notifyOnPurchase', v)} />
      </SettingsRow>
      <SettingsRow label="Alerta de Stock Bajo">
        <ToggleSwitch value={!!watch('notifyOnLowStock')} onChange={v => setValue('notifyOnLowStock', v)} />
      </SettingsRow>
      <SettingsRow label="Transferencia entre Depósitos">
        <ToggleSwitch value={!!watch('notifyOnTransfer')} onChange={v => setValue('notifyOnTransfer', v)} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Umbral de Stock Bajo (unidades)" hint="Se dispara la alerta cuando el stock cae por debajo de este número.">
        <Input type="number" min={0} {...register('lowStockThreshold', { valueAsNumber: true })} style={{ width: '100px' }} />
      </SettingsRow>

    </SettingsSection>
  );
}

// ─── Integration Settings (Quick toggles) ───────────────────────────────────

export function IntegrationSettingsPanel() {
  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<IntegrationSettings>({
    key: 'integrations',
    queryFn: () => settingsApi.getSettings().then(d => d.integrations),
    mutateFn: settingsApi.updateIntegrations,
  });
  const { watch, setValue } = form;

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Integraciones Activas" description="Habilita o deshabilita integraciones externas. Para credenciales, ve al módulo Integraciones." onSave={onSubmit} isSaving={isSaving}>

      <SettingsRow label="MercadoPago" hint="Procesamiento de pagos online y en POS.">
        <ToggleSwitch value={!!watch('mercadopagoEnabled')} onChange={v => setValue('mercadopagoEnabled', v)} />
      </SettingsRow>
      <SettingsRow label="MercadoLibre" hint="Sincronización de catálogo y pedidos del marketplace.">
        <ToggleSwitch value={!!watch('mercadolibreEnabled')} onChange={v => setValue('mercadolibreEnabled', v)} />
      </SettingsRow>
      <SettingsRow label="WooCommerce" hint="Sincronización con tienda WordPress.">
        <ToggleSwitch value={!!watch('woocommerceEnabled')} onChange={v => setValue('woocommerceEnabled', v)} />
      </SettingsRow>
      <SettingsRow label="Shopify" hint="Catálogo, stock y pedidos de Shopify.">
        <ToggleSwitch value={!!watch('shopifyEnabled')} onChange={v => setValue('shopifyEnabled', v)} />
      </SettingsRow>

    </SettingsSection>
  );
}
