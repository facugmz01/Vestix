import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  Save,
  ExternalLink,
  Copy,
  Image as ImageIcon,
  CreditCard,
  Truck,
  Share2,
  Globe,
  Plus,
  Trash2,
  Store,
  Navigation,
  KeyRound,
  MessageSquareText,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { storefrontSettingsSchema, parseStorefrontSettings, type StorefrontSettingsFormData } from '../schemas/storefrontSettings.schema';
import { priceListsApi } from '@/api/priceLists.api';
import { financeApi } from '@/api/finance.api';
import { generateUUID } from '@/utils/generateUUID';
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

  const { register, control, handleSubmit, reset, watch, formState: { isDirty } } = useForm<StorefrontSettingsFormData>({
    resolver: zodResolver(storefrontSettingsSchema),
    defaultValues: parseStorefrontSettings({}),
  });

  const { fields: shippingFields, append: appendShipping, remove: removeShipping } = useFieldArray({
    control,
    name: 'shippingMethods'
  });

  const watchedHidePrices = watch('hidePrices');
  const watchedTemplate = watch('whatsappMessageTemplate') || 'Hola, quiero consultar el precio de {product_name} (SKU: {sku})';
  const watchedWhatsAppNumber = watch('whatsappNumber') || watch('whatsapp') || '';

  const samplePreviewText = watchedTemplate
    .replace(/\{product_name\}/g, 'Remera Oversize Cotton')
    .replace(/\{sku\}/g, 'REM-OVR-BLK-L')
    .replace(/\{variant\}/g, 'L - Negro')
    .replace(/\{url\}/g, `${window.location.origin}/store/product/prod_demo`);

  const cleanSampleNumber = watchedWhatsAppNumber.replace(/\D/g, '');
  const sampleWhatsAppUrl = cleanSampleNumber
    ? `https://wa.me/${cleanSampleNumber}?text=${encodeURIComponent(samplePreviewText)}`
    : '#';

  useEffect(() => {
    if (settings?.storefront) {
      reset(parseStorefrontSettings(settings.storefront));
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
          <div className={styles.urlBarRow}>
            <div className={styles.urlBar}>
              <Globe size={16} />
              <a href={storefrontUrl} target="_blank" rel="noreferrer" className={styles.urlBarLink}>{storefrontUrl}</a>
            </div>
            <Button type="button" variant="outline" icon={<Copy size={16} />} onClick={copyUrl} title="Copiar" />
            <Button type="button" variant="outline" icon={<ExternalLink size={16} />} onClick={() => window.open(storefrontUrl, '_blank')} title="Abrir" />
          </div>

          <ToggleSwitch label="Habilitar Tienda web pública" hint="Los clientes pueden visitar tu catálogo cuando está activo." {...register('enabled')} />
          
          <hr className={styles.divider} />

          <div className={clsx(styles.grid, styles.grid2)}>
            <div>
              <label className={styles.selectLabel}>Color principal</label>
              <div className={styles.colorPickerRow}>
                <input type="color" {...register('primaryColor')} className={styles.colorInputCompact} />
                <Input {...register('primaryColor')} containerClassName={styles.inputFixed100} />
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
            
            <div className={styles.toggleStack}>
              <ToggleSwitch label="Mostrar encabezado" {...register('showHeader')} />
              <ToggleSwitch label="Incluir nombre del comercio" {...register('showStoreName')} />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><MessageSquareText size={18} /> Modo Catálogo / Consultas por WhatsApp</h3>
          <p className={styles.cardDescription}>
            Permite ocultar los precios de los productos y reemplazar la compra directa por un botón de consulta instantánea a WhatsApp.
          </p>
        </header>
        <div className={styles.cardBody}>
          <ToggleSwitch
            label="Activar Modo Catálogo (Ocultar Precios)"
            hint="Oculta precios, descuentos y carrito en la tienda pública; las compras se gestionan vía WhatsApp."
            {...register('hidePrices')}
          />

          <div className={clsx(styles.grid, styles.grid2, styles.marginTop16)}>
            <Input
              label="Número de WhatsApp receptor"
              placeholder="5491112345678"
              hint="Código de país y área sin '+' ni espacios (ej: 54911XXXXXXXX)."
              {...register('whatsappNumber')}
            />
            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Variables disponibles para el mensaje</label>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5', marginTop: '4px' }}>
                Podés usar <code>{'{product_name}'}</code>, <code>{'{sku}'}</code>, <code>{'{variant}'}</code> y <code>{'{url}'}</code> dentro de la plantilla.
              </div>
            </div>
          </div>

          <div className={styles.marginTop16}>
            <label className={styles.selectLabel}>Plantilla del mensaje predeterminado</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Hola, quiero consultar el precio de {product_name} (SKU: {sku})"
              {...register('whatsappMessageTemplate')}
            />
          </div>

          {/* Dynamic Live Preview */}
          <div style={{
            marginTop: '16px',
            padding: '14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-secondary, #f8fafc)',
            border: '1px solid var(--border-color, #e2e8f0)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: 600, fontSize: '0.875rem' }}>
              <Eye size={16} color="var(--primary, #2563eb)" />
              <span>Vista previa del mensaje en WhatsApp:</span>
            </div>
            <div style={{
              backgroundColor: '#dcf8c6',
              color: '#111827',
              padding: '10px 14px',
              borderRadius: '8px 8px 0 8px',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxWidth: '90%',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
              {samplePreviewText}
            </div>
            {cleanSampleNumber ? (
              <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Destinatario configurado: <strong>+{cleanSampleNumber}</strong>
                {sampleWhatsAppUrl !== '#' && (
                  <a
                    href={sampleWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: '12px', color: '#16a34a', textDecoration: 'underline', fontWeight: 500 }}
                  >
                    Probar enlace WhatsApp ↗
                  </a>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '10px', fontSize: '0.8125rem', color: '#dc2626' }}>
                ⚠️ Recordá ingresar el número de WhatsApp para que el botón funcione correctamente.
              </div>
            )}
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
                hint="Se usa el primer canal habilitado. La tienda adapta el formulario de login según este canal (teléfono o correo)."
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
            <ImageIcon size={32} color="var(--text-muted)" className={styles.emptyStateIcon} />
            <p className={styles.emptyStateTitle}>Arrastrá imágenes acá o hacé click para seleccionar</p>
            <p className={styles.emptyStateHint}>PNG, JPG o WebP. Hasta 5MB por imagen. máx 5 en total</p>
          </div>
          <p className={styles.catalogHint}>
            No hay categorías con foto cargada. <a href="/admin/catalog?tab=categories" className={styles.inlineLink}>Cargar fotos</a> a tus categorías para destacarlas.
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
              <select {...register('priceListToShow')} className={styles.select} disabled={watchedHidePrices}>
                <option value="">Precio Base (Sin Lista)</option>
                {priceLists?.data?.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
              {watchedHidePrices && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deshabilitado en Modo Catálogo</span>
              )}
            </div>

            <div className={styles.selectGroup}>
              <label className={styles.selectLabel}>Orden por defecto</label>
              <select {...register('defaultSort')} className={styles.select}>
                <option value="name_asc">Nombre A → Z</option>
                <option value="price_asc" disabled={watchedHidePrices}>Menor Precio</option>
                <option value="price_desc" disabled={watchedHidePrices}>Mayor Precio</option>
              </select>
            </div>
          </div>
          
          <hr className={styles.divider} />
          
          <div className={styles.stackColGap16}>
            <ToggleSwitch label="Ocultar productos sin stock" {...register('hideOutOfStock')} />
            <ToggleSwitch label="Ocultar filtros por marca" {...register('hideBrandFilters')} />
          </div>

          <hr className={styles.divider} />

          <h4 className={styles.sectionSubtitle}>Medios de pago permitidos</h4>
          <div className={styles.paymentMethodList}>
            {paymentMethods?.map(pm => (
              <label key={pm.id} className={styles.checkboxCard}>
                <input type="checkbox" value={pm.id} {...register('allowedPaymentMethods')} />
                <span className={styles.paymentMethodName}>{pm.name}</span>
                <span className={styles.paymentMethodBadge}>{pm.type}</span>
              </label>
            ))}
          </div>

          <div className={styles.marginTop24}>
            <h4 className={styles.sectionSubtitle}>Datos bancarios para transferencia</h4>
            <p className={styles.cardDescription}>
              Se muestran al cliente en el checkout y al confirmar un pedido pagado por transferencia.
            </p>
            <div className={clsx(styles.grid, styles.grid2, styles.marginTop12)}>
              <Input
                label="Nombre y apellido del titular"
                placeholder="Juan Pérez"
                {...register('transferHolderName')}
              />
              <Input
                label="Entidad bancaria"
                placeholder="Banco Nación / Mercado Pago"
                {...register('transferBankName')}
              />
              <Input
                label="CBU / CVU"
                placeholder="0000003100000000000000"
                {...register('transferCbu')}
              />
              <Input
                label="Alias"
                placeholder="comercio.mp"
                {...register('transferAlias')}
              />
              <Input
                label="CUIT / CUIL del titular"
                placeholder="20-12345678-9"
                hint="Se muestra al comprador para agilizar la conciliación"
                {...register('transferCuit')}
              />
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Tipo de cuenta</label>
                <select {...register('transferAccountType')} className={styles.select}>
                  <option value="">Sin especificar</option>
                  <option value="CA_PESOS">Caja de Ahorro en $</option>
                  <option value="CC_PESOS">Cuenta Corriente en $</option>
                  <option value="ALIAS_MP">Cuenta Mercado Pago</option>
                  <option value="CVU">CVU (Fintech)</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}><Truck size={18} /> Opciones de Envío / Retiro</h3>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.shippingList}>
            {shippingFields.map((field, index) => (
              <div key={field.id} className={styles.shippingRow}>
                <div className={clsx(styles.shippingFields, styles.shippingFieldsGrid)}>
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
                <Button type="button" variant="outline" icon={<Trash2 size={16} />} onClick={() => removeShipping(index)} className={clsx(styles.btnDangerOutline, styles.deleteShippingBtn)} />
              </div>
            ))}
            <Button type="button" variant="outline" icon={<Plus size={16} />} onClick={() => appendShipping({ id: generateUUID(), name: '', price: 0, type: 'SHIPPING' })} className={styles.btnAlignStart}>
              Agregar opción
            </Button>
          </div>

          <hr className={styles.divider} />

          <div className={clsx(styles.selectGroup, styles.selectConstrained)}>
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
          <div className={clsx(styles.grid, styles.grid2, styles.marginTop12)}>
            <Input label="API Key Andreani" type="password" {...register('deliverySettings.carriers.andreani.apiKey')} />
            <Input label="Client ID" {...register('deliverySettings.carriers.andreani.clientId')} />
            <Input label="Contrato" {...register('deliverySettings.carriers.andreani.contract')} />
          </div>
          <hr className={clsx(styles.divider, styles.marginTop16)} />
          <ToggleSwitch label="Mercado Envíos habilitado" {...register('deliverySettings.carriers.mercadoEnvios.enabled')} />
          <div className={clsx(styles.grid, styles.grid2, styles.marginTop12)}>
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
