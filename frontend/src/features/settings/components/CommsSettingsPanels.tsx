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

      <SettingsRow label="Email (SMTP)" hint="Configuración del servidor saliente de correos.">
        <ToggleSwitch value={!!watch('emailEnabled')} onChange={v => setValue('emailEnabled', v)} />
      </SettingsRow>
      {watch('emailEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input placeholder="Host (ej. smtp.gmail.com)" {...register('smtpHost')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="number" placeholder="Port" {...register('smtpPort', { valueAsNumber: true })} style={{ width: '100px' }} />
          <Input placeholder="Usuario" {...register('smtpUser')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="password" placeholder="Contraseña" {...register('smtpPass')} style={{ flex: 1, minWidth: '200px' }} />
        </div>
      )}

      <SettingsRow label="SMS (Android Gateway)" hint="Envía SMS gratis usando la app local en un celular.">
        <ToggleSwitch value={!!watch('smsEnabled')} onChange={v => setValue('smsEnabled', v)} />
      </SettingsRow>
      {watch('smsEnabled') && (
        <div style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <Input placeholder="URL del Gateway (ej. http://192.168.1.50:8080/v1/sms)" {...register('smsGatewayUrl')} />
        </div>
      )}

      <SettingsRow label="WhatsApp (OpenWA)" hint="Requiere servidor de Node.js OpenWA corriendo.">
        <ToggleSwitch value={!!watch('whatsappEnabled')} onChange={v => setValue('whatsappEnabled', v)} />
      </SettingsRow>
      {watch('whatsappEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px' }}>
          <Input placeholder="URL Node (ej. http://localhost:8080)" {...register('openWaUrl')} style={{ flex: 2 }} />
          <Input placeholder="Session ID (ej. default)" {...register('openWaSession')} style={{ flex: 1 }} />
        </div>
      )}

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
  const { watch, setValue, register } = form;

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '16px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Integraciones Activas" description="Habilita o deshabilita integraciones externas. Para credenciales, ve al módulo Integraciones." onSave={onSubmit} isSaving={isSaving}>

      <SettingsRow label="MercadoPago" hint="Procesamiento de pagos online y en POS.">
        <ToggleSwitch value={!!watch('mercadopagoEnabled')} onChange={v => setValue('mercadopagoEnabled', v)} />
      </SettingsRow>
      
      <SettingsRow label="MercadoLibre" hint="Sincronización de catálogo y pedidos del marketplace.">
        <ToggleSwitch value={!!watch('mercadolibreEnabled')} onChange={v => setValue('mercadolibreEnabled', v)} />
      </SettingsRow>
      {watch('mercadolibreEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px' }}>
          <Input placeholder="App ID" {...register('mlAppId')} style={{ flex: 1 }} />
          <Input type="password" placeholder="Secret Key" {...register('mlSecretKey')} style={{ flex: 2 }} />
        </div>
      )}

      <SettingsRow label="WooCommerce" hint="Sincronización con tienda WordPress.">
        <ToggleSwitch value={!!watch('woocommerceEnabled')} onChange={v => setValue('woocommerceEnabled', v)} />
      </SettingsRow>
      {watch('woocommerceEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input placeholder="Store URL (ej. https://mitienda.com)" {...register('wooStoreUrl')} style={{ flex: '1 1 100%' }} />
          <Input placeholder="Consumer Key" {...register('wooConsumerKey')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="password" placeholder="Consumer Secret" {...register('wooConsumerSecret')} style={{ flex: 1, minWidth: '200px' }} />
        </div>
      )}

      <SettingsRow label="Shopify" hint="Catálogo, stock y pedidos de Shopify.">
        <ToggleSwitch value={!!watch('shopifyEnabled')} onChange={v => setValue('shopifyEnabled', v)} />
      </SettingsRow>
      {watch('shopifyEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px' }}>
          <Input placeholder="Shopify Store (ej. mitienda.myshopify.com)" {...register('shopifyStoreUrl')} style={{ flex: 1 }} />
          <Input type="password" placeholder="Admin API Access Token" {...register('shopifyAccessToken')} style={{ flex: 2 }} />
        </div>
      )}

    </SettingsSection>
  );
}
