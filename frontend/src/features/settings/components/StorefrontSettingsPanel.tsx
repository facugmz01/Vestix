import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider } from './SettingsLayout';
import { Input, Button } from '@/components/ui';
import { SystemSettings } from '@/api/settings.api';
import { ExternalLink, Copy, Image as ImageIcon, CreditCard, Truck, MessageCircle, Share2, Download, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export function StorefrontSettingsPanel() {
  const { register, watch } = useFormContext<SystemSettings>();

  const storefrontUrl = "https://ventavweb.com.ar/web/comercio-FACUNDOGOM";

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
              <option value="minorista">Minorista (precio venta)</option>
              <option value="mayorista">Mayorista</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Precio base que ven los visitantes sin iniciar sesión.</p>
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

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} color="var(--accent)" /> Medios de pago</span>}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>MercadoPago Checkout Pro</h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Credenciales en <a href="https://developers.mercadopago.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>developers.mercadopago.com</a>. Usa Producción para cobros reales o Sandbox para pruebas.</p>
        
        <div className="grid-responsive grid-cols-2" style={{ gap: '24px', marginBottom: '24px' }}>
          <Input label="Public Key" placeholder="APP_USR-..." {...register('storefront.mpPublicKey')} />
          <Input label="Access Token" placeholder="APP_USR-..." type="password" {...register('storefront.mpAccessToken')} hint="Clave privada (no secreta). Indicar secreta (no compartir)." />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <Input label="CBU / Alias para transferencia" placeholder="0000003100000000000000 / alias.banco" {...register('storefront.transferCbu')} />
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Si lo completas, aparece la opción "Transferencia" en el checkout con los datos para transferir.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="acceptCash" {...register('storefront.acceptCash')} />
          <label htmlFor="acceptCash" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>Aceptar pago en efectivo</label>
        </div>
        <p style={{ marginTop: '4px', marginLeft: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>Muestra la opción "Efectivo" en el checkout. Ideal si envías o retiran y te pagan por WhatsApp.</p>
      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} color="var(--accent)" /> Envíos</span>}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Información de envío / retiro</label>
          <textarea
            {...register('storefront.shippingInfo')}
            placeholder="Ej: Envíos a todo el país por OCA/Correo Argentino. Retiro en sucursal de L a V de 9 a 18hs."
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
          />
          <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>Se muestra en el checkout debajo de los totales.</p>
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
          <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Controla si el cliente puede o debe ingresar su dirección al hacer el pedido.</p>
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

      {/* Deployment options */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>1</div>
          <h4 style={{ margin: 0, fontSize: '15px' }}>Instalá la tienda en tu propio hosting</h4>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>El archivo ya viene configurado para tu comercio. Solo descargalo y subilo a tu hosting. No necesita base de datos propia — obtiene todo desde la API de VentaWeb.</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-primary)' }}>
                <li style={{ marginBottom: '8px' }}>Descargá el archivo <strong>index.php</strong> con el botón de la derecha.</li>
                <li style={{ marginBottom: '8px' }}>Subilo a la raíz (o una carpeta) de tu hosting.</li>
                <li>¡Listo! Accedé a <span style={{ color: '#ef4444' }}>tudominio.com</span> y ya verás tu tienda.</li>
              </ol>
              <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '8px', marginTop: '16px', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>ⓘ</span>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>El archivo viene preconfigurado con tu comercio <strong>(FACUNDOGOM)</strong>, y apuntando a la API de VentaWeb, no necesitás editarlo.</p>
              </div>
            </div>
            <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Button variant="outline" icon={<ExternalLink size={16} />} style={{ width: '100%', justifyContent: 'center' }}>Ver tienda de ejemplo</Button>
              <Button variant="primary" icon={<Download size={16} />} style={{ width: '100%', justifyContent: 'center' }}>Descargar index.php</Button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>2</div>
          <h4 style={{ margin: 0, fontSize: '15px' }}>Pedí tu subdominio gratis <span style={{ background: '#10b981', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '8px' }}>NUEVO</span></h4>
        </div>
        <div style={{ padding: '20px' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>Te creamos un subdominio <strong>tu-comercio.ventaweb.com.ar</strong> apuntando a tu tienda sin costo adicional. Incluye HTTPS y configuración DNS.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-base)', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Globe size={24} color="var(--accent)" />
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Tu tienda quedaría en:</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>https://facundogom.ventaweb.com.ar</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <Button style={{ background: '#10b981', color: '#fff', border: 'none' }}>Solicitar subdominio</Button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Respuesta en menos de 24 hs.</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(30, 41, 59, 1)', color: '#fff', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} /> Sitio web 100% personalizado <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>A medida</span>
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '500px' }}>
            ¿Necesitás algo más que una tienda estándar? Diseñamos y desarrollamos tu sitio web a medida: diseño propio, dominio personalizado, funcionalidades exclusivas, integración con el ERP y soporte continuo.
          </p>
          <div style={{ display: 'flex', gap: '32px', marginTop: '16px' }}>
            <div><p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Diseño</p><p style={{ margin: 0, fontSize: '12px' }}>100% a tu imagen</p></div>
            <div><p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Dominio</p><p style={{ margin: 0, fontSize: '12px' }}>tucomercio.com.ar</p></div>
            <div><p style={{ margin: 0, fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>Soporte</p><p style={{ margin: 0, fontSize: '12px' }}>24x7x365</p></div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button style={{ background: '#10b981', color: '#fff', border: 'none' }} icon={<MessageCircle size={16} />}>Consultar por WhatsApp</Button>
          <Button variant="outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Escribir por email</Button>
        </div>
      </div>
    </>
  );
}
