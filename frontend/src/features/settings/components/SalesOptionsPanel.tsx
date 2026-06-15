import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider } from './SettingsLayout';
import { Input, Button, ConfirmDialog } from '@/components/ui';
import { SystemSettings } from '@/api/settings.api';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function SalesOptionsPanel() {
  const { register, watch, formState: { errors } } = useFormContext<SystemSettings>();
  const [clearCatalogOpen, setClearCatalogOpen] = useState(false);

  const handleClearCatalog = () => {
    toast.error('Función "Vaciar catálogo" en desarrollo');
    setClearCatalogOpen(false);
  };

  const handleRecotizar = (type: 'Oficial' | 'Blue') => {
    toast.success(`Recotizando productos USD ${type}...`);
  };

  return (
    <>
      <SettingsSection title="Opciones de venta" description="Comportamiento del carrito, impresión y flujos de caja.">
        
        <SettingsRow label="Permitir venta sin stock" hint="Si está activo, se pueden confirmar ventas aunque el producto no tenga stock disponible. El stock quedará en negativo hasta que se registre una entrada.">
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.allowNegativeStock')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>

        <SettingsDivider />

        <SettingsRow label="Impresión en ticket (impresora térmica 80mm)" hint="Al imprimir una venta, el formato se adapta a papel de 80mm tipo supermercado. Ideal para impresoras térmicas de rollo.">
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.thermalPrint80mm')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>

        <SettingsDivider />

        <SettingsRow label="Ticket fiscal térmico (70mm)" hint="Agrega el botón 'Imprimir fiscal' en la vista de una venta cuando tiene CAE emitido. El formato se ajusta a rollo de 70mm con QR AFIP.">
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.fiscalPrint70mm')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>

        <SettingsDivider />

        <div className="grid-responsive grid-cols-2" style={{ gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Modo de caja</label>
            <select
              {...register('pos.boxMode')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="SHARED">Compartido — cajas del comercio común</option>
              <option value="STRICT">Estricto — caja por empleado</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <strong>Compartido:</strong> pueden existir varias cajas abiertas simultáneamente. Cada empleado vende desde su propio turno si lo tiene abierto; si no, sus ventas van al primer turno abierto del comercio.<br/><br/>
              <strong>Estricto:</strong> cada empleado debe abrir su propio turno en su propia caja antes de vender. Solo ve y opera sus cajas; no puede acceder a los turnos de otros.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Tipo de precio por defecto</label>
            <select
              {...register('pos.defaultPriceType')}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="minorista">Minorista</option>
              <option value="mayorista">Mayorista</option>
            </select>
            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Tipo de precio que se selecciona automáticamente al abrir el formulario de nueva venta. Si el cliente elegido tiene un tipo de precio propio, ese tendrá prioridad.
            </p>
          </div>
        </div>

      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <SettingsSection title="CONFIGURACIÓN DE PRODUCTOS">
        <SettingsRow label="Código interno obligatorio" hint='El campo "Código" es requerido al crear o editar un producto.'>
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.requireInternalCode')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Código de barras obligatorio" hint='El campo "Código de barras" es requerido al crear o editar un producto.'>
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.requireBarcode')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Marca obligatoria" hint='Se debe seleccionar una marca al crear o editar un producto.'>
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.requireBrand')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Descripción obligatoria" hint='El campo "Descripción" es requerido al crear o editar un producto.'>
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.requireDescription')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>
        <SettingsDivider />
        <SettingsRow label="Datos de envío obligatorios en productos" hint='Si está activo, peso, alto, ancho y largo serán campos obligatorios al crear o editar un producto.'>
          <label className="toggle-switch">
            <input type="checkbox" {...register('pos.requireShippingDimensions')} />
            <span className="slider"></span>
          </label>
        </SettingsRow>

        <SettingsDivider />

        <div style={{ marginTop: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Cotización del dólar Oficial (ARS por US$1)
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '200px' }}>
              <Input type="number" prefix="$" placeholder="Ej: 1400" {...register('pos.officialDollarQuote', { valueAsNumber: true })} />
            </div>
            <Button variant="outline" type="button" icon={<RefreshCw size={14} color="#eab308" />} onClick={() => handleRecotizar('Oficial')} style={{ color: '#eab308', borderColor: '#eab308' }}>
              Recotizar productos USD Oficial
            </Button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Permite cargar precios de productos en dólares. <strong>Recotizar</strong> actualiza los precios ARS de los productos marcados como Oficial según la cotización ingresada.</p>
        </div>

        <div style={{ marginTop: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Cotización del dólar Blue (ARS por US$1)
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '200px' }}>
              <Input type="number" prefix="$" placeholder="Ej: 1600" {...register('pos.blueDollarQuote', { valueAsNumber: true })} />
            </div>
            <Button variant="outline" type="button" icon={<RefreshCw size={14} color="#0ea5e9" />} onClick={() => handleRecotizar('Blue')} style={{ color: '#0ea5e9', borderColor: '#0ea5e9' }}>
              Recotizar productos USD Blue
            </Button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Para productos cuyos precios en USD fueron cargados usando la cotización blue. <strong>Recotizar</strong> actualiza los precios ARS de los productos marcados como Blue.</p>
        </div>

      </SettingsSection>

      <div style={{ height: '24px' }}></div>

      <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', padding: '20px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={16} /> Zona de peligro
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Vaciar catálogo de productos</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Elimina todos los productos activos. El historial de ventas no se verá afectado.</p>
          </div>
          <Button variant="outline" type="button" onClick={() => setClearCatalogOpen(true)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
            Vaciar catálogo
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={clearCatalogOpen}
        title="Vaciar catálogo de productos"
        message="Esta acción no se puede deshacer. Se eliminarán permanentemente todos los productos activos de la base de datos."
        confirmText="Sí, vaciar catálogo"
        confirmLabel="Vaciar catálogo"
        variant="danger"
        isDestructive
        onConfirm={handleClearCatalog}
        onCancel={() => setClearCatalogOpen(false)}
      />
    </>
  );
}
