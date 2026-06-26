import { useFormContext, useFieldArray } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider } from './SettingsLayout';
import { Input, Button } from '@/components/ui';
import { SystemSettings } from '@/api/settings.api';
import { ExternalLink, Copy, Image as ImageIcon, CreditCard, Truck, MessageCircle, Share2, Globe, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { priceListsApi } from '@/api/priceLists.api';
import { financeApi } from '@/api/finance.api';

export function StorefrontSettingsPanel() {
  const { register, watch, control } = useFormContext<SystemSettings>();

  const { data: priceLists } = useQuery({
    queryKey: ['priceLists', 'storefront-panel'],
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100, isActive: true }),
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ['paymentMethods', 'storefront-panel'],
    queryFn: () => financeApi.getPaymentMethods(),
  });

  const { fields: shippingFields, append: appendShipping, remove: removeShipping } = useFieldArray({
    control,
    name: 'storefront.shippingMethods'
  });

  const storefrontUrl = `${window.location.origin}/store`;

  const copyUrl = () => {
    navigator.clipboard.writeText(storefrontUrl);
    toast.success('URL copiada al portapapeles');
  };

  return (
    <>
      <SettingsSection title="Tu tienda online">
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500 }}>
            <Globe size={16} />
            <a href={storefrontUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>{storefrontUrl}</a>
          </div>
          <Button variant="outline" icon={<Copy size={16} />} onClick={copyUrl} title="Copiar" />
          <Button variant="outline" icon={<ExternalLink size={16} />} onClick={() => window.open(storefrontUrl, '_blank')} title="Abrir" />
        </div>

        <SettingsRow label="Habilitar Tienda web pública" hint="Los clientes pueden visitar la URL de tu tienda cuando está activo.">
          <label className="toggle-switch">
            <input type="checkbox" {...register('storefront.enabled')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>

        <SettingsDivider />

        <div className="grid-responsive grid-cols-3" style={{ gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Color principal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" {...register('storefront.primaryColor')} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
              <Input {...register('storefront.primaryColor')} style={{ width: '100px' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Fuente de letra</label>
            <select
              {...register('storefront.fontFamily')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="Inter">Sistema (predeterminado)</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>Hola. Esta es la fuente de tu tienda - $1234</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Encabezado / Slogan</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input type="checkbox" {...register('storefront.showHeader')} /> Mostrar encabezado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input type="checkbox" {...register('storefront.showStoreName')} /> Incluir nombre del comercio
              </label>
            </div>
          </div>
        </div>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={16} color="var(--accent)" /> Carrusel de imágenes</span>}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>Sube hasta 5 imágenes para el carrusel de la tienda web. Se usan para banners. Podés agregar un link opcional a cada una.</p>
        <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', cursor: 'pointer' }}>
          <ImageIcon size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>Arrastrá imágenes acá o hacé click para seleccionar</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>PNG, JPG o WebP. Hasta 5MB por imagen. máx 5 en total</p>
        </div>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={16} color="var(--accent)" /> Categorías destacadas en home</span>}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Seleccioná qué categorías con foto se muestran como tarjetas grandes debajo del carrusel.</p>
        <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '8px' }}>No hay categorías con foto cargada. <a href="/admin/catalog?tab=categories" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Cargar fotos</a> a tus categorías para destacarlas acá.</p>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title="Configuración de productos">
        <div className="grid-responsive grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Precio a mostrar en la tienda web</label>
            <select
              {...register('storefront.priceListToShow')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="">Precio Base (Sin Lista)</option>
              {priceLists?.data?.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Precio que ven los visitantes. Si es vacío, usa precio base.</p>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Orden por defecto en la tienda web</label>
            <select
              {...register('storefront.defaultSort')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="name_asc">Nombre A → Z</option>
              <option value="price_asc">Menor Precio</option>
              <option value="price_desc">Mayor Precio</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Orden inicial con el que aparecen los productos al entrar a la tienda.</p>
          </div>
        </div>

        <SettingsRow label="Ocultar productos sin stock" hint="Los productos con stock 0 no se mostrarán en la tienda web.">
          <label className="toggle-switch">
            <input type="checkbox" {...register('storefront.hideOutOfStock')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Ocultar filtros por marca" hint="Si está activo, no se mostrarán los chips de filtro por marca en la tienda web.">
          <label className="toggle-switch">
            <input type="checkbox" {...register('storefront.hideBrandFilters')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} color="var(--accent)" /> Medios de pago permitidos</span>}>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Seleccioná qué métodos de cobro del POS estarán habilitados para compras web.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {paymentMethods?.map(pm => (
            <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="checkbox" value={pm.id} {...register('storefront.allowedPaymentMethods')} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{pm.name}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>{pm.type}</span>
            </label>
          ))}
        </div>

        <SettingsDivider />
        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Cobros por Transferencia</h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Configurá los datos bancarios o billetera para recibir transferencias.</p>

        <div style={{ marginBottom: '24px' }}>
          <Input label="CBU / Alias para transferencia" placeholder="0000003100000000000000 / alias.banco" {...register('storefront.transferCbu')} />
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Mostrado a clientes que eligen Transferencia Bancaria.</p>
        </div>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} color="var(--accent)" /> Opciones de Envío / Retiro</span>}>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Configurá las opciones de entrega que verán los clientes en el checkout.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {shippingFields.map((field, index) => (
            <div key={field.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg-base)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>Nombre / Descripción</label>
                  <input {...register(`storefront.shippingMethods.${index}.name` as const)} placeholder="Ej: Envío a Domicilio" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>Tipo</label>
                  <select {...register(`storefront.shippingMethods.${index}.type` as const)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <option value="SHIPPING">Envío</option>
                    <option value="PICKUP">Retiro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', fontWeight: 600 }}>Costo ($)</label>
                  <input type="number" {...register(`storefront.shippingMethods.${index}.price` as const, { valueAsNumber: true })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }} />
                </div>
              </div>
              <button type="button" onClick={() => removeShipping(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', marginTop: '18px' }} title="Eliminar método"><Trash2 size={18} /></button>
            </div>
          ))}
          <Button type="button" variant="outline" icon={<Plus size={16} />} onClick={() => appendShipping({ id: crypto.randomUUID(), name: '', price: 0, type: 'SHIPPING' })} style={{ alignSelf: 'flex-start' }}>
            Agregar opción de envío
          </Button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Pedir datos de envío en el checkout (localidad / dirección)</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <input type="radio" value="optional" {...register('storefront.requireShippingData')} />
              <span>Opcional</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ef4444' }}>
              <input type="radio" value="required" {...register('storefront.requireShippingData')} />
              <span>Obligatorio</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <input type="radio" value="none" {...register('storefront.requireShippingData')} />
              <span>No pedir</span>
            </label>
          </div>
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Aplica a pedidos tipo Envío.</p>
        </div>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MessageCircle size={16} color="#25D366" /> WhatsApp</span>}>
        <Input label="Número de WhatsApp" placeholder="5491112345678" {...register('storefront.whatsapp')} />
        <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Con código de país, sin espacios ni guiones (ej: <span style={{ color: '#ef4444' }}>549112345678</span>). Si lo completás, aparece un botón flotante en tu tienda.</p>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Share2 size={16} color="var(--accent)" /> Redes sociales</span>}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Pegá la URL completa de cada red. Sólo se muestran las que estén completas.</p>
        <div className="grid-responsive grid-cols-2" style={{ gap: '16px' }}>
          <Input label="Instagram" placeholder="https://instagram.com/tucomercio" {...register('storefront.instagramUrl')} />
          <Input label="Facebook" placeholder="https://facebook.com/tucomercio" {...register('storefront.facebookUrl')} />
          <Input label="TikTok" placeholder="https://tiktok.com/@tucomercio" {...register('storefront.tiktokUrl')} />
          <Input label="YouTube" placeholder="https://youtube.com/@tucanal" {...register('storefront.youtubeUrl')} />
          <Input label="X / Twitter" placeholder="https://x.com/tucomercio" {...register('storefront.xUrl')} />
        </div>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>
    </>
  );
}
