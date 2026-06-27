import { useState } from 'react';
import { settingsApi, SystemSettings } from '@/api/settings.api';
import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider, ToggleSwitch } from './SettingsLayout';
import { Input } from '@/components/ui';
import { toast } from 'react-hot-toast';

// ─── Sentinel que el backend devuelve para campos sensibles enmascarados ───────
const BACKEND_MASK = '••••••••';

/**
 * Hook helper: devuelve props para un campo de contraseña que viene enmascarado
 * del backend. Muestra placeholder "ya configurada" y solo envía el valor cuando
 * el usuario escribe algo nuevo. Si el usuario borra el campo, queda vacío y el
 * backend conserva la credencial anterior.
 */
function useMaskedField(rawValue: string | undefined) {
  const isPreloaded = rawValue === BACKEND_MASK;
  return {
    // Si el valor es la máscara del backend, no lo metemos en el input como value
    // (lo deja vacío para que el usuario sepa que puede reemplazarlo)
    defaultDisplayValue: isPreloaded ? '' : (rawValue ?? ''),
    placeholder: isPreloaded ? '★ Ya configurada — dejá vacío para no cambiar' : 'Contraseña / API Key',
    isPreloaded,
  };
}

// ─── Botón de prueba reutilizable con estado de carga ─────────────────────────

interface TestButtonProps {
  toastId: string;
  loadingLabel: string;
  onClick: () => Promise<{ success: boolean; message: string }>;
  disabled?: boolean;
}

function TestButton({ toastId, loadingLabel, onClick, disabled }: TestButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    toast.loading(loadingLabel, { id: toastId });
    try {
      const res = await onClick();
      if (res.success) toast.success(res.message, { id: toastId });
      else toast.error(res.message, { id: toastId });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error de conexión', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const btnStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: 'var(--bg-overlay)',
    color: loading || disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    fontSize: '13px',
    opacity: loading || disabled ? 0.6 : 1,
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  };

  return (
    <button type="button" onClick={handleClick} disabled={loading || disabled} style={btnStyle}>
      {loading ? '⏳ Probando...' : 'Probar Conexión'}
    </button>
  );
}

// ─── Notification Settings ───────────────────────────────────────────────────

export function NotificationSettingsPanel() {
  const { register, watch, setValue } = useFormContext<SystemSettings>();

  // Para las pruebas de conexión, enviamos el objeto completo de notifications.
  // El backend resolverá la credencial real desde DB si el campo viene vacío.
  const notifValues = watch('notifications');

  // Campos sensibles: si el backend los envió enmascarados, los mostramos como
  // placeholders y dejamos el campo vacío en el form.
  const smtpPassMask    = useMaskedField(watch('notifications.smtpPass'));
  const evolutionKeyMask = useMaskedField(watch('notifications.evolutionApiKey'));
  const fcmKeyMask      = useMaskedField(watch('notifications.fcmServerKey'));

  return (
    <SettingsSection title="Notificaciones" description="Canales de comunicación habilitados y reglas de disparo automático.">

      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Canales habilitados</p>

      {/* ─── Email SMTP ─── */}
      <SettingsRow label="Email (SMTP)" hint="Configuración del servidor saliente de correos.">
        <ToggleSwitch value={!!watch('notifications.emailEnabled')} onChange={v => setValue('notifications.emailEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.emailEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Input placeholder="Host (ej. smtp.gmail.com)" {...register('notifications.smtpHost')} style={{ flex: 1, minWidth: '200px' }} />
          <Input type="number" placeholder="Port" {...register('notifications.smtpPort', { valueAsNumber: true })} style={{ width: '100px' }} />
          <Input placeholder="Usuario" {...register('notifications.smtpUser')} style={{ flex: 1, minWidth: '200px' }} />
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              type="password"
              placeholder={smtpPassMask.placeholder}
              {...register('notifications.smtpPass')}
              defaultValue={smtpPassMask.defaultDisplayValue}
            />
            {smtpPassMask.isPreloaded && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Contraseña ya guardada. Escribí una nueva para reemplazarla.</span>
            )}
          </div>
          <TestButton
            toastId="test-smtp"
            loadingLabel="Probando SMTP..."
            disabled={!watch('notifications.smtpHost')}
            onClick={() => settingsApi.testSmtp(notifValues)}
          />
        </div>
      )}

      {/* ─── SMS Android Gateway ─── */}
      <SettingsRow label="SMS (Android Gateway)" hint="Envía SMS gratis usando la app local en un celular.">
        <ToggleSwitch value={!!watch('notifications.smsEnabled')} onChange={v => setValue('notifications.smsEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.smsEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', alignItems: 'center' }}>
          <Input placeholder="URL del Gateway (ej. http://192.168.1.50:8080/v1/sms)" {...register('notifications.smsGatewayUrl')} style={{ flex: 1 }} />
          <TestButton
            toastId="test-sms"
            loadingLabel="Haciendo ping al Gateway..."
            disabled={!watch('notifications.smsGatewayUrl')}
            onClick={() => settingsApi.testSms(notifValues)}
          />
        </div>
      )}

      {/* ─── WhatsApp Evolution API ─── */}
      <SettingsRow label="WhatsApp (Evolution API)" hint="Requiere Evolution API corriendo. Configurá la URL, API Key e instancia.">
        <ToggleSwitch value={!!watch('notifications.whatsappEnabled')} onChange={v => setValue('notifications.whatsappEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.whatsappEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Input placeholder="URL (ej. http://localhost:8080)" {...register('notifications.evolutionApiUrl')} style={{ flex: 2, minWidth: '200px' }} />
          <div style={{ flex: 2, minWidth: '160px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              type="password"
              placeholder={evolutionKeyMask.placeholder}
              {...register('notifications.evolutionApiKey')}
              defaultValue={evolutionKeyMask.defaultDisplayValue}
            />
            {evolutionKeyMask.isPreloaded && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>API Key ya guardada. Escribí una nueva para reemplazarla.</span>
            )}
          </div>
          <Input placeholder="Instancia (ej. store-main)" {...register('notifications.evolutionInstance')} style={{ flex: 1, minWidth: '140px' }} />
          <TestButton
            toastId="test-whatsapp"
            loadingLabel="Verificando Evolution API..."
            disabled={!watch('notifications.evolutionApiUrl')}
            onClick={() => settingsApi.testWhatsapp(notifValues)}
          />
        </div>
      )}

      {/* ─── Push FCM ─── */}
      <SettingsRow label="Push (App Móvil FCM)" hint="Requiere Server Key de Firebase Cloud Messaging.">
        <ToggleSwitch value={!!watch('notifications.pushEnabled')} onChange={v => setValue('notifications.pushEnabled', v, { shouldDirty: true })} />
      </SettingsRow>
      {watch('notifications.pushEnabled') && (
        <div style={{ display: 'flex', gap: '12px', paddingLeft: '24px', marginBottom: '16px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Input
              type="password"
              placeholder={fcmKeyMask.placeholder}
              {...register('notifications.fcmServerKey')}
              defaultValue={fcmKeyMask.defaultDisplayValue}
            />
            {fcmKeyMask.isPreloaded && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Server Key ya guardada. Escribí una nueva para reemplazarla.</span>
            )}
          </div>
          <TestButton
            toastId="test-push"
            loadingLabel="Enviando test a FCM..."
            disabled={!watch('notifications.fcmServerKey') && !fcmKeyMask.isPreloaded}
            onClick={() => settingsApi.testPush(notifValues)}
          />
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

      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '16px' }}>Gestor de Plantillas</p>

      <div style={{ padding: '16px', background: 'var(--bg-overlay)', borderRadius: '8px', border: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
          Las plantillas de mensajes (Email, WhatsApp, SMS) se gestionan en su propia sección.
        </p>
        <a href="/admin/notifications" style={{ display: 'inline-block', padding: '8px 16px', background: 'var(--accent)', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
          Ir a Notificaciones y Plantillas
        </a>
      </div>

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
