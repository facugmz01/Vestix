import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Bell, Plug, Mail, Smartphone, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { settingsApi, type ConnectionTestResult } from '@/api/settings.api';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { notificationSettingsSchema, type NotificationSettingsFormData, integrationSettingsSchema, type IntegrationSettingsFormData } from '../schemas/commsSettings.schema';
import styles from './SettingsShared.module.css';
import { WhatsAppEvolutionPanel } from './WhatsAppEvolutionPanel';
import { NotificationChannelPicker } from './NotificationChannelPicker';

const BACKEND_MASK = '••••••••';

function useMaskedField(rawValue: string | undefined) {
  const isPreloaded = rawValue === BACKEND_MASK;
  return {
    defaultDisplayValue: isPreloaded ? '' : (rawValue ?? ''),
    placeholder: isPreloaded ? '★ Ya configurada — dejá vacío para no cambiar' : 'Contraseña / API Key',
    isPreloaded,
  };
}

interface ConnectionTestPanelProps {
  toastId: string;
  loadingLabel: string;
  recipientLabel: string;
  recipientPlaceholder: string;
  recipientType?: string;
  disabled?: boolean;
  onTest: (recipient: string) => Promise<ConnectionTestResult>;
}

function ConnectionTestPanel({
  toastId,
  loadingLabel,
  recipientLabel,
  recipientPlaceholder,
  recipientType = 'text',
  disabled,
  onTest,
}: ConnectionTestPanelProps) {
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectionTestResult | null>(null);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    toast.loading(loadingLabel, { id: toastId });
    try {
      const res = await onTest(recipient.trim());
      setResult(res);
      if (res.success) toast.success(res.message, { id: toastId });
      else toast.error(res.message, { id: toastId });
    } catch (e: any) {
      const fallback: ConnectionTestResult = {
        success: false,
        message: e.response?.data?.message || 'Error de conexión',
        logs: [`[${new Date().toISOString()}] ${e.response?.data?.message || e.message || 'Error de conexión'}`],
      };
      setResult(fallback);
      toast.error(fallback.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div className={styles.testRow}>
        <div className={styles.testRecipient}>
          <Input
            label={recipientLabel}
            type={recipientType}
            placeholder={recipientPlaceholder}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={handleClick}
          disabled={loading || disabled}
          loading={loading}
        >
          Probar Conexión
        </Button>
      </div>

      <div>
        <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          Consola de prueba
        </p>
        <div
          className={clsx(styles.testConsole, {
            [styles.testConsoleSuccess]: result?.success,
            [styles.testConsoleError]: result && !result.success,
          })}
          role="log"
          aria-live="polite"
        >
          {result?.logs?.length
            ? result.logs.join('\n')
            : <span className={styles.testConsoleEmpty}>Los resultados de la prueba aparecerán aquí.</span>}
        </div>
      </div>
    </div>
  );
}

export function NotificationSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('notifications');

  const { register, watch, handleSubmit, reset, control, formState: { isDirty } } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettingsSchema.parse({}),
  });

  useEffect(() => {
    if (settings?.notifications) {
      reset(notificationSettingsSchema.parse(settings.notifications));
    }
  }, [settings, reset]);

  const onSubmit = (data: NotificationSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const emailEnabled = watch('emailEnabled');
  const smsEnabled = watch('smsEnabled');
  const whatsappEnabled = watch('whatsappEnabled');
  const pushEnabled = watch('pushEnabled');
  const allValues = watch();

  const smtpPassMask = useMaskedField(watch('smtpPass'));
  const evolutionKeyMask = useMaskedField(watch('evolutionApiKey'));
  const fcmKeyMask = useMaskedField(watch('fcmServerKey'));

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Bell size={18} /> Canales de Notificación</h3>
          <p className={styles.cardDescription}>Servidores y pasarelas de comunicación saliente.</p>
        </header>

        <div className={styles.cardBody}>
          <ToggleSwitch label="Email (SMTP)" hint="Servidor saliente de correos." {...register('emailEnabled')} />
          {emailEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Input placeholder="Host" {...register('smtpHost')} style={{ flex: 1 }} />
                <Input type="number" placeholder="Port" {...register('smtpPort', { valueAsNumber: true })} style={{ width: '80px' }} />
                <Input placeholder="Usuario" {...register('smtpUser')} style={{ flex: 1 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Input type="password" placeholder={smtpPassMask.placeholder} {...register('smtpPass')} defaultValue={smtpPassMask.defaultDisplayValue} />
                </div>
              </div>
              <ConnectionTestPanel
                toastId="test-smtp"
                loadingLabel="Probando SMTP..."
                recipientLabel="Destinatario de prueba (email)"
                recipientPlaceholder="admin@empresa.com"
                recipientType="email"
                disabled={!watch('smtpHost')}
                onTest={(recipient) => settingsApi.testSmtp({ ...allValues, recipient })}
              />
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <ToggleSwitch label="SMS (Android Gateway)" hint="Envía SMS gratis usando una app local en un celular." {...register('smsEnabled')} />
          {smsEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Input placeholder="URL del Gateway" {...register('smsGatewayUrl')} />
              <ConnectionTestPanel
                toastId="test-sms"
                loadingLabel="Probando SMS..."
                recipientLabel="Destinatario de prueba (teléfono)"
                recipientPlaceholder="5491122334455"
                recipientType="tel"
                disabled={!watch('smsGatewayUrl')}
                onTest={(recipient) => settingsApi.testSms({ ...allValues, recipient })}
              />
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <ToggleSwitch label="WhatsApp (Evolution API)" hint="Integración con instancia local de WhatsApp." {...register('whatsappEnabled')} />
          {whatsappEnabled && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Input placeholder="URL API" {...register('evolutionApiUrl')} style={{ flex: 1 }} />
                  <Input type="password" placeholder={evolutionKeyMask.placeholder} {...register('evolutionApiKey')} defaultValue={evolutionKeyMask.defaultDisplayValue} style={{ flex: 1 }} />
                  <Input placeholder="Instancia" {...register('evolutionInstance')} style={{ flex: 1 }} />
                </div>
                <ConnectionTestPanel
                  toastId="test-wpp"
                  loadingLabel="Probando WhatsApp..."
                  recipientLabel="Destinatario de prueba (WhatsApp)"
                  recipientPlaceholder="5491122334455"
                  recipientType="tel"
                  disabled={!watch('evolutionApiUrl')}
                  onTest={(recipient) => settingsApi.testWhatsapp({ ...allValues, recipient })}
                />
              </div>
              <WhatsAppEvolutionPanel enabled={whatsappEnabled} />
            </>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <ToggleSwitch label="Push (FCM)" hint="Notificaciones nativas a la app móvil." {...register('pushEnabled')} />
          {pushEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Input type="password" placeholder={fcmKeyMask.placeholder} {...register('fcmServerKey')} defaultValue={fcmKeyMask.defaultDisplayValue} />
              <ConnectionTestPanel
                toastId="test-push"
                loadingLabel="Enviando push..."
                recipientLabel="Destinatario de prueba (token FCM)"
                recipientPlaceholder="fcm-device-token..."
                disabled={!watch('fcmServerKey') && !fcmKeyMask.isPreloaded}
                onTest={(recipient) => settingsApi.testPush({ ...allValues, recipient })}
              />
            </div>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><MessageSquare size={18} /> Eventos y Reglas</h3>
          <p className={styles.cardDescription}>Qué acciones disparan notificaciones automáticamente.</p>
        </header>
        <div className={styles.cardBody}>
          <ToggleSwitch label="Venta Confirmada" {...register('notifyOnSale')} />
          <Controller
            control={control}
            name="saleChannels"
            render={({ field }) => (
              <NotificationChannelPicker
                label="Canales para ventas"
                hint="Se enviará por cada canal seleccionado cuando el cliente tenga el dato de contacto."
                value={field.value ?? ['EMAIL', 'WHATSAPP']}
                onChange={field.onChange}
              />
            )}
          />
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <ToggleSwitch label="Orden de Compra Emitida" {...register('notifyOnPurchase')} />
          <Controller
            control={control}
            name="purchaseChannels"
            render={({ field }) => (
              <NotificationChannelPicker
                label="Canales para compras"
                hint="Notificaciones al proveedor y recepción de mercadería."
                value={field.value ?? ['EMAIL']}
                onChange={field.onChange}
              />
            )}
          />
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <ToggleSwitch label="Alerta de Stock Bajo" {...register('notifyOnLowStock')} />
          <Controller
            control={control}
            name="lowStockChannels"
            render={({ field }) => (
              <NotificationChannelPicker
                label="Canales para alertas de stock"
                value={field.value ?? ['EMAIL']}
                onChange={field.onChange}
              />
            )}
          />
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <ToggleSwitch label="Transferencia entre Depósitos" {...register('notifyOnTransfer')} />
          <Controller
            control={control}
            name="transferChannels"
            render={({ field }) => (
              <NotificationChannelPicker
                label="Canales para transferencias"
                value={field.value ?? ['EMAIL']}
                onChange={field.onChange}
              />
            )}
          />
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <ToggleSwitch label="Envíos y Entregas" hint="Despacho, OTP, llegada del repartidor y confirmación de entrega." {...register('notifyOnDelivery')} />
          <Controller
            control={control}
            name="deliveryChannels"
            render={({ field }) => (
              <NotificationChannelPicker
                label="Canales para envíos y entregas"
                value={field.value ?? ['WHATSAPP']}
                onChange={field.onChange}
              />
            )}
          />
          
          <div style={{ marginTop: '16px' }}>
            <Input type="number" label="Umbral de Stock Bajo (unidades)" {...register('lowStockThreshold', { valueAsNumber: true })} style={{ width: '120px' }} />
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Notificaciones'}
        </Button>
      </div>

    </form>
  );
}

// ─── Integration Settings ────────────────────────────────────────────────────
export function IntegrationSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('integrations');

  const { register, watch, handleSubmit, reset, formState: { isDirty } } = useForm<IntegrationSettingsFormData>({
    resolver: zodResolver(integrationSettingsSchema),
  });

  useEffect(() => {
    if (settings?.integrations) reset(settings.integrations);
  }, [settings, reset]);

  const onSubmit = (data: IntegrationSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const mercadolibreEnabled = watch('mercadolibreEnabled');
  const woocommerceEnabled = watch('woocommerceEnabled');
  const shopifyEnabled = watch('shopifyEnabled');

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Plug size={18} /> Integraciones de Terceros</h3>
          <p className={styles.cardDescription}>Marketplaces, tiendas externas y pasarelas de pago.</p>
        </header>

        <div className={styles.cardBody}>
          <ToggleSwitch label="MercadoPago" hint="Procesamiento de cobros con QR." {...register('mercadopagoEnabled')} />
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          
          <ToggleSwitch label="MercadoLibre" hint="Sincronización de catálogo y pedidos." {...register('mercadolibreEnabled')} />
          {mercadolibreEnabled && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Input placeholder="App ID" {...register('mlAppId')} style={{ flex: 1 }} />
              <Input type="password" placeholder="Secret Key" {...register('mlSecretKey')} style={{ flex: 2 }} />
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <ToggleSwitch label="WooCommerce" hint="Tienda WordPress externa." {...register('woocommerceEnabled')} />
          {woocommerceEnabled && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', padding: '16px', flexWrap: 'wrap', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Input placeholder="Store URL" {...register('wooStoreUrl')} style={{ flex: '1 1 100%' }} />
              <Input placeholder="Consumer Key" {...register('wooConsumerKey')} style={{ flex: 1 }} />
              <Input type="password" placeholder="Consumer Secret" {...register('wooConsumerSecret')} style={{ flex: 1 }} />
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <ToggleSwitch label="Shopify" hint="Sincronizar catálogo y ventas de Shopify." {...register('shopifyEnabled')} />
          {shopifyEnabled && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Input placeholder="Shopify Store URL" {...register('shopifyStoreUrl')} style={{ flex: 1 }} />
              <Input type="password" placeholder="Admin API Access Token" {...register('shopifyAccessToken')} style={{ flex: 2 }} />
            </div>
          )}
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Integraciones'}
        </Button>
      </div>
    </form>
  );
}
