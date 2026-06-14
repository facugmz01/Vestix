import { settingsApi, SystemSettings } from '@/api/settings.api';
import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider, ToggleSwitch } from './SettingsLayout';
import { Input } from '@/components/ui';
import { toast } from 'react-hot-toast';

// ─── Notification Settings ───────────────────────────────────────────────────

export function NotificationSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  return (
    <SettingsSection title="Notificaciones" description="Canales de comunicación habilitados y reglas de disparo automático.">

      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Canales habilitados</p>

      <SettingsRow label="Email (SMTP)" hint="Configuración del servidor saliente de correos.">
        <ToggleSwitch value={!!watch('notifications.emailEnabled')} onChange={v => setValue('notifications.emailEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.emailEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input placeholder="Host (ej. smtp.gmail.com)" {...register('notifications.smtpHost')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="number" placeholder="Port" {...register('notifications.smtpPort', { valueAsNumber: true })} style={{ width: '100px' }} />
          <Input placeholder="Usuario" {...register('notifications.smtpUser')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="password" placeholder="Contraseña" {...register('notifications.smtpPass')} style={{ flex: 1, minWidth: '200px' }} />
          <button 
            type="button" 
            onClick={async () => {
              const loading = toast.loading('Probando SMTP...');
              try {
                const data = watch('notifications');
                const res = await settingsApi.testSmtp(data);
                if (res.success) toast.success(res.message, { id: loading });
                else toast.error(res.message, { id: loading });
              } catch (e: any) {
                toast.error(e.response?.data?.message || 'Error de conexión', { id: loading });
              }
            }}
            style={{ padding: '8px 16px', background: 'var(--bg-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            Probar Conexión
          </button>
        </div>
      )}

      <SettingsRow label="SMS (Android Gateway)" hint="Envía SMS gratis usando la app local en un celular.">
        <ToggleSwitch value={!!watch('notifications.smsEnabled')} onChange={v => setValue('notifications.smsEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.smsEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', alignItems: 'center' }}>
          <Input placeholder="URL del Gateway (ej. http://192.168.1.50:8080/v1/sms)" {...register('notifications.smsGatewayUrl')} style={{ flex: 1 }} />
          <button 
            type="button" 
            onClick={async () => {
              const loading = toast.loading('Haciendo ping al Gateway...');
              try {
                const data = watch('notifications');
                const res = await settingsApi.testSms(data);
                if (res.success) toast.success(res.message, { id: loading });
                else toast.error(res.message, { id: loading });
              } catch (e: any) {
                toast.error(e.response?.data?.message || 'Error de conexión', { id: loading });
              }
            }}
            style={{ padding: '8px 16px', background: 'var(--bg-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            Probar Conexión
          </button>
        </div>
      )}

      <SettingsRow label="WhatsApp (OpenWA)" hint="Requiere servidor de Node.js OpenWA corriendo.">
        <ToggleSwitch value={!!watch('notifications.whatsappEnabled')} onChange={v => setValue('notifications.whatsappEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.whatsappEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', alignItems: 'center' }}>
          <Input placeholder="URL Node (ej. http://localhost:8080)" {...register('notifications.openWaUrl')} style={{ flex: 2 }} />
          <Input placeholder="Session ID (ej. default)" {...register('notifications.openWaSession')} style={{ flex: 1 }} />
          <button 
            type="button" 
            onClick={async () => {
              const loading = toast.loading('Haciendo ping a OpenWA...');
              try {
                const data = watch('notifications');
                const res = await settingsApi.testWhatsapp(data);
                if (res.success) toast.success(res.message, { id: loading });
                else toast.error(res.message, { id: loading });
              } catch (e: any) {
                toast.error(e.response?.data?.message || 'Error de conexión', { id: loading });
              }
            }}
            style={{ padding: '8px 16px', background: 'var(--bg-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            Probar Conexión
          </button>
        </div>
      )}

      <SettingsRow label="Push (App Móvil FCM)" hint="Requiere Server Key de Firebase Cloud Messaging.">
        <ToggleSwitch value={!!watch('notifications.pushEnabled')} onChange={v => setValue('notifications.pushEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.pushEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', alignItems: 'center' }}>
          <Input placeholder="FCM Server Key (Empieza con AAA...)" {...register('notifications.fcmServerKey')} style={{ flex: 1 }} />
          <button 
            type="button" 
            onClick={async () => {
              const loading = toast.loading('Enviando test a FCM...');
              try {
                const data = watch('notifications');
                const res = await settingsApi.testPush(data);
                if (res.success) toast.success(res.message, { id: loading });
                else toast.error(res.message, { id: loading });
              } catch (e: any) {
                toast.error(e.response?.data?.message || 'Error de FCM', { id: loading });
              }
            }}
            style={{ padding: '8px 16px', background: 'var(--bg-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
          >
            Probar Conexión
          </button>
        </div>
      )}

      <SettingsDivider />

      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Eventos que disparan notificaciones</p>

      <SettingsRow label="Venta Confirmada">
        <ToggleSwitch value={!!watch('notifications.notifyOnSale')} onChange={v => setValue('notifications.notifyOnSale', v, { shouldDirty: true })} />
      </SettingsRow>
      <SettingsRow label="Orden de Compra Emitida">
        <ToggleSwitch value={!!watch('notifications.notifyOnPurchase')} onChange={v => setValue('notifications.notifyOnPurchase', v, { shouldDirty: true })} />
      </SettingsRow>
      <SettingsRow label="Alerta de Stock Bajo">
        <ToggleSwitch value={!!watch('notifications.notifyOnLowStock')} onChange={v => setValue('notifications.notifyOnLowStock', v, { shouldDirty: true })} />
      </SettingsRow>
      <SettingsRow label="Transferencia entre Depósitos">
        <ToggleSwitch value={!!watch('notifications.notifyOnTransfer')} onChange={v => setValue('notifications.notifyOnTransfer', v, { shouldDirty: true })} />
      </SettingsRow>

      <SettingsDivider />

      <SettingsRow label="Umbral de Stock Bajo (unidades)" hint="Se dispara la alerta cuando el stock cae por debajo de este número.">
        <Input type="number" min={0} {...register('notifications.lowStockThreshold', { valueAsNumber: true })} style={{ width: '100px' }} />
      </SettingsRow>

    </SettingsSection>
  );
}

// ─── Integration Settings (Quick toggles) ───────────────────────────────────

export function IntegrationSettingsPanel() {
  const { watch, setValue, register } = useFormContext<SystemSettings>();

  return (
    <SettingsSection title="Integraciones Activas" description="Habilita o deshabilita integraciones externas. Para credenciales, ve al módulo Integraciones.">

      <SettingsRow label="MercadoPago" hint="Procesamiento de pagos online y en POS.">
        <ToggleSwitch value={!!watch('integrations.mercadopagoEnabled')} onChange={v => setValue('integrations.mercadopagoEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      
      <SettingsRow label="MercadoLibre" hint="Sincronización de catálogo y pedidos del marketplace.">
        <ToggleSwitch value={!!watch('integrations.mercadolibreEnabled')} onChange={v => setValue('integrations.mercadolibreEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('integrations.mercadolibreEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px' }}>
          <Input placeholder="App ID" {...register('integrations.mlAppId')} style={{ flex: 1 }} />
          <Input type="password" placeholder="Secret Key" {...register('integrations.mlSecretKey')} style={{ flex: 2 }} />
        </div>
      )}

      <SettingsRow label="WooCommerce" hint="Sincronización con tienda WordPress.">
        <ToggleSwitch value={!!watch('integrations.woocommerceEnabled')} onChange={v => setValue('integrations.woocommerceEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('integrations.woocommerceEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input placeholder="Store URL (ej. https://mitienda.com)" {...register('integrations.wooStoreUrl')} style={{ flex: '1 1 100%' }} />
          <Input placeholder="Consumer Key" {...register('integrations.wooConsumerKey')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="password" placeholder="Consumer Secret" {...register('integrations.wooConsumerSecret')} style={{ flex: 1, minWidth: '200px' }} />
        </div>
      )}

      <SettingsRow label="Shopify" hint="Catálogo, stock y pedidos de Shopify.">
        <ToggleSwitch value={!!watch('integrations.shopifyEnabled')} onChange={v => setValue('integrations.shopifyEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('integrations.shopifyEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px' }}>
          <Input placeholder="Shopify Store (ej. mitienda.myshopify.com)" {...register('integrations.shopifyStoreUrl')} style={{ flex: 1 }} />
          <Input type="password" placeholder="Admin API Access Token" {...register('integrations.shopifyAccessToken')} style={{ flex: 2 }} />
        </div>
      )}

    </SettingsSection>
  );
}
