import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Save, ExternalLink, Copy, Image as ImageIcon, CreditCard, Truck, MessageCircle, Share2, Globe, Plus, Trash2, Store, Navigation, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { storefrontSettingsSchema, type StorefrontSettingsFormData } from '../schemas/storefrontSettings.schema';
import { priceListsApi } from '@/api/priceLists.api';
import { financeApi } from '@/api/finance.api';
import styles from './SettingsShared.module.css';
import { NotificationChannelPicker } from './NotificationChannelPicker';

export function StorefrontSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('storefront');

  const { data: priceLists } = useQuery({
    queryKey: ['priceLists', 'storefront-panel'],
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100, isActive: true }),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods', 'storefront-panel'],
    queryFn: () => financeApi.getPaymentMethods(),
  });

  const { register, control, handleSubmit, reset, formState: { isDirty } } = useForm<StorefrontSettingsFormData>({
    resolver: zodResolver(storefrontSettingsSchema),
    defaultValues: storefrontSettingsSchema.parse({}),
  });

  const { fields: shippingFields, append: appendShipping, remove: removeShipping } = useFieldArray({
    control,
    name: 'shippingMethods'
  });

  useEffect(() => {
    if (settings?.storefront) {
      reset(storefrontSettingsSchema.parse(settings.storefront));
    }
  }, [settings, reset]);

  const onSubmit = (data: StorefrontSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const storefrontUrl = `${window.location.origin}/store`;
  const copyUrl = () => {
    navigator.clipboard.writeText(storefrontUrl);
    toast.success('URL copiada al portapapeles');
  };

  if (isLoading) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Store size={18} /> Tu tienda online</h3>
          <p className={styles.cardDescription}>Configura el aspecto y la disponibilidad del catálogo web público.</p>
        </header>

        <div className={styles.cardBody}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
              <Globe size={16} />
              <a href={storefrontUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{storefrontUrl}</a>
            </div>
            <Button type="button" variant="outline" icon={<Copy size={16} />} onClick={copyUrl} title="Copiar" />
            <Button type="button" variant="outline" icon={<ExternalLink size={16} />} onClick={() => window.open(storefrontUrl, '_blank')} title="Abrir" />
          </div>

          <ToggleSwitch label="Habilitar Tienda web pública" hint="Los clientes pueden visitar tu catálogo cuando está activo." {...register('enabled')} />
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className={clsx(styles.grid, styles.grid2)}>
            <div>
              <label className={styles.selectLabel}>Color principal</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" {...register('primaryColor')} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                <Input {...register('primaryColor')} style={{ width: '100px' }} />
              </div>
            </div>

            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Fuente de letra</label>
              <select {...register('fontFamily')} className={styles.select}>
                <option value="Inter">Sistema (predeterminado)</option>
                <option value="Roboto">Roboto</option>
                <option value="Outfit">Outfit</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              <ToggleSwitch label="Mostrar encabezado" {...register('showHeader')} />
              <ToggleSwitch label="Incluir nombre del comercio" {...register('showStoreName')} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><KeyRound size={18} /> Inicio de sesión de clientes</h3>
          <p className={styles.cardDescription}>
            Canal por defecto para enviar el código OTP cuando un cliente ingresa a la tienda online.
            Los canales deben estar habilitados en Ajustes → Notificaciones.
          </p>
        </header>
        <div className={styles.cardBody}>
          <Controller
            control={control}
            name="storeLoginChannels"
            render={({ field }) => (
              <NotificationChannelPicker
                label="Canal de verificación (OTP)"
                hint="Se usa el primer canal habilitado. El login actual es por teléfono (WhatsApp o SMS recomendado)."
                value={field.value ?? ['WHATSAPP']}
                onChange={field.onChange}
                singleSelect
              />
            )}
          />
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><ImageIcon size={18} /> Multimedia y Destacados</h3>
          <p className={styles.cardDescription}>Imágenes del carrusel y categorías principales de la portada.</p>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.emptyStateCard}>
            <ImageIcon size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Arrastrá imágenes acá o hacé click para seleccionar</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>PNG, JPG o WebP. Hasta 5MB por imagen. máx 5 en total</p>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '16px' }}>
            No hay categorías con foto cargada. <a href="/admin/catalog?tab=categories" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Cargar fotos</a> a tus categorías para destacarlas.
          </p>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><CreditCard size={18} /> Configuración de Catálogo y Checkout</h3>
        </header>
        <div className={styles.cardBody}>
          <div className={clsx(styles.grid, styles.grid2)}>
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Precio a mostrar en tienda</label>
              <select {...register('priceListToShow')} className={styles.select}>
                <option value="">Precio Base (Sin Lista)</option>
                {priceLists?.data?.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Orden por defecto</label>
              <select {...register('defaultSort')} className={styles.select}>
                <option value="name_asc">Nombre A → Z</option>
                <option value="price_asc">Menor Precio</option>
                <option value="price_desc">Mayor Precio</option>
              </select>
            </div>
          </div>
          
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ToggleSwitch label="Ocultar productos sin stock" {...register('hideOutOfStock')} />
            <ToggleSwitch label="Ocultar filtros por marca" {...register('hideBrandFilters')} />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Medios de pago permitidos</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paymentMethods?.map(pm => (
              <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-surface-hover)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="checkbox" value={pm.id} {...register('allowedPaymentMethods')} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{pm.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>{pm.type}</span>
              </label>
            ))}
          </div>

          <div style={{ marginTop: '24px' }}>
            <Input label="CBU / Alias para transferencia" placeholder="0000003100000000000000 / alias.banco" {...register('transferCbu')} style={{ maxWidth: '400px' }} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Truck size={18} /> Opciones de Envío / Retiro</h3>
        </header>
        <div className={styles.cardBody}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shippingFields.map((field, index) => (
              <div key={field.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg-surface-hover)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                  <Input label="Nombre" placeholder="Ej: Envío a Domicilio" {...register(`shippingMethods.${index}.name` as const)} />
                  <div className={styles.selectGroup}>
                    <label className={styles.selectLabel}>Tipo</label>
                    <select {...register(`shippingMethods.${index}.type` as const)} className={styles.select}>
                      <option value="SHIPPING">Envío</option>
                      <option value="PICKUP">Retiro</option>
                    </select>
                  </div>
                  <Input type="number" label="Costo ($)" {...register(`shippingMethods.${index}.price` as const, { valueAsNumber: true })} />
                </div>
                <Button type="button" variant="outline" icon={<Trash2 size={16} />} onClick={() => removeShipping(index)} style={{ color: '#ef4444', borderColor: '#ef4444', marginTop: '22px' }} />
              </div>
            ))}
            <Button type="button" variant="outline" icon={<Plus size={16} />} onClick={() => appendShipping({ id: crypto.randomUUID(), name: '', price: 0, type: 'SHIPPING' })} style={{ alignSelf: 'flex-start' }}>
              Agregar opción
            </Button>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className={styles.selectGroup} style={{ maxWidth: '300px' }}>
            <label className={styles.selectLabel}>Pedir datos de envío en el checkout</label>
            <select {...register('requireShippingData')} className={styles.select}>
              <option value="optional">Opcional</option>
              <option value="required">Obligatorio</option>
              <option value="none">No pedir</option>
            </select>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Navigation size={18} /> Configuración de Delivery</h3>
        </header>
        <div className={styles.cardBody}>
          <div className={clsx(styles.grid, styles.grid2)}>
            <ToggleSwitch label="Tracking GPS en vivo" {...register('deliverySettings.enableGpsTracking')} />
            <ToggleSwitch label="Mostrar mapa al cliente" {...register('deliverySettings.showMapToCustomer')} />
            <ToggleSwitch label="Validación por geofence" {...register('deliverySettings.enableGeofence')} />
            <ToggleSwitch label="Foto obligatoria al entregar" {...register('deliverySettings.requirePhotoOnDelivery')} />
            <Input
              type="number"
              label="Radio geofence (metros)"
              {...register('deliverySettings.geofenceRadiusMeters', { valueAsNumber: true })}
            />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Truck size={18} /> Carriers externos</h3>
          <p className={styles.cardDescription}>Credenciales para Andreani y Mercado Envíos al despachar pedidos.</p>
        </header>
        <div className={styles.cardBody}>
          <ToggleSwitch label="Andreani habilitado" {...register('deliverySettings.carriers.andreani.enabled')} />
          <div className={clsx(styles.grid, styles.grid2)} style={{ marginTop: '12px' }}>
            <Input label="API Key Andreani" type="password" {...register('deliverySettings.carriers.andreani.apiKey')} />
            <Input label="Client ID" {...register('deliverySettings.carriers.andreani.clientId')} />
            <Input label="Contrato" {...register('deliverySettings.carriers.andreani.contract')} />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '16px 0' }} />
          <ToggleSwitch label="Mercado Envíos habilitado" {...register('deliverySettings.carriers.mercadoEnvios.enabled')} />
          <div className={clsx(styles.grid, styles.grid2)} style={{ marginTop: '12px' }}>
            <Input label="Access Token" type="password" {...register('deliverySettings.carriers.mercadoEnvios.accessToken')} />
            <Input label="User ID" {...register('deliverySettings.carriers.mercadoEnvios.userId')} />
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Share2 size={18} /> Redes Sociales & Contacto</h3>
        </header>
        <div className={styles.cardBody}>
          <div className={clsx(styles.grid, styles.grid2)}>
            <Input label="WhatsApp" placeholder="5491112345678" {...register('whatsapp')} />
            <Input label="Instagram" placeholder="https://instagram.com/tucomercio" {...register('instagramUrl')} />
            <Input label="Facebook" placeholder="https://facebook.com/tucomercio" {...register('facebookUrl')} />
            <Input label="TikTok" placeholder="https://tiktok.com/@tucomercio" {...register('tiktokUrl')} />
            <Input label="YouTube" placeholder="https://youtube.com/@tucanal" {...register('youtubeUrl')} />
            <Input label="X / Twitter" placeholder="https://x.com/tucomercio" {...register('xUrl')} />
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
          {mutation.isPending ? 'Guardando...' : 'Guardar Tienda Web'}
        </Button>
      </div>
    </form>
  );
}
