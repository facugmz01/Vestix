import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, RefreshCw, Trash2, ShoppingCart, Settings2, Package, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { Input, Button, ConfirmDialog, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { posSettingsSchema, type PosSettingsFormData } from '../schemas/posSettings.schema';
import { settingsApi } from '@/api/settings.api';
import styles from './SettingsShared.module.css'; // Reusing the same grid/card styles

export function SalesOptionsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('pos');
  const [clearCatalogOpen, setClearCatalogOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<PosSettingsFormData>({
    resolver: zodResolver(posSettingsSchema),
  });

  useEffect(() => {
    if (settings?.pos) {
      reset(settings.pos);
    }
  }, [settings, reset]);

  const onSubmit = (data: PosSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  const handleClearCatalog = () => {
    toast.error('Función "Vaciar catálogo" en desarrollo');
    setClearCatalogOpen(false);
  };

  const handleRecotizar = async (type: 'Oficial' | 'Blue') => {
    try {
      const res = await settingsApi.repriceUsd(type);
      if (res.success) {
        toast.success(`Recotizados ${res.updatedCount} productos vinculados a USD ${type}`);
      }
    } catch (error: any) {
      toast.error(`Error al recotizar: ${error.message}`);
    }
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando configuraciones...</div>;
  }

  return (
    <div className={styles.panelContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} style={{ animation: 'none', gap: 'var(--space-6)' }} noValidate>
        
        {/* 1. Opciones de venta y caja */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <ShoppingCart size={18} aria-hidden="true" />
              Flujos de Venta y Caja
            </h3>
            <p className={styles.cardDescription}>
              Comportamiento del carrito, manejo de turnos e impresión de tickets.
            </p>
          </header>
          
          <div className={styles.cardBody}>
            <ToggleSwitch 
              label="Permitir venta sin stock" 
              hint="Si está activo, se pueden confirmar ventas aunque el producto no tenga stock. Quedará en negativo."
              {...register('allowNegativeStock')} 
            />
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            
            <ToggleSwitch 
              label="Impresión en ticket (80mm)" 
              hint="El formato se adapta a papel de 80mm tipo supermercado. Ideal para térmicas."
              {...register('thermalPrint80mm')} 
            />
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            
            <ToggleSwitch 
              label="Ticket fiscal térmico (70mm)" 
              hint="Agrega botón 'Imprimir fiscal' para formato 70mm con QR AFIP."
              {...register('fiscalPrint70mm')} 
            />
            
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            
            <div className={clsx(styles.grid, styles.grid2)}>
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Modo de caja</label>
                <select {...register('boxMode')} className={styles.select}>
                  <option value="SHARED">Compartido — cajas comunes</option>
                  <option value="STRICT">Estricto — caja por empleado</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Compartido: turnos comunes. Estricto: cada empleado abre su turno.
                </p>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Tipo de precio por defecto</label>
                <select {...register('defaultPriceType')} className={styles.select}>
                  <option value="minorista">Minorista</option>
                  <option value="mayorista">Mayorista</option>
                </select>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Aplica automáticamente a menos que el cliente tenga otro preferido.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Configuración de productos */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Package size={18} aria-hidden="true" />
              Restricciones de Producto
            </h3>
            <p className={styles.cardDescription}>
              Campos obligatorios al momento de crear o editar ítems en el catálogo.
            </p>
          </header>
          <div className={styles.cardBody}>
            <ToggleSwitch 
              label="Código interno obligatorio" 
              {...register('requireInternalCode')} 
            />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <ToggleSwitch 
              label="Código de barras obligatorio" 
              {...register('requireBarcode')} 
            />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <ToggleSwitch 
              label="Marca obligatoria" 
              {...register('requireBrand')} 
            />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <ToggleSwitch 
              label="Descripción obligatoria" 
              {...register('requireDescription')} 
            />
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <ToggleSwitch 
              label="Datos de envío (dimensiones) obligatorios" 
              hint="Exigir peso, alto, ancho y largo."
              {...register('requireShippingDimensions')} 
            />
          </div>
        </section>

        {/* 3. Cotizaciones Dólar */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <Calculator size={18} aria-hidden="true" />
              Cotizaciones Dólar
            </h3>
            <p className={styles.cardDescription}>
              Útiles para productos vinculados a moneda extranjera.
            </p>
          </header>
          <div className={styles.cardBody}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Cotización Oficial (ARS por US$1)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: '200px' }}>
                  <Input type="number" prefix="$" placeholder="Ej: 1400" {...register('officialDollarQuote', { valueAsNumber: true })} />
                </div>
                <Button variant="outline" type="button" icon={<RefreshCw size={14} color="#eab308" />} onClick={() => handleRecotizar('Oficial')} style={{ color: '#eab308', borderColor: '#eab308' }}>
                  Recotizar productos
                </Button>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Cotización Blue (ARS por US$1)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: '200px' }}>
                  <Input type="number" prefix="$" placeholder="Ej: 1600" {...register('blueDollarQuote', { valueAsNumber: true })} />
                </div>
                <Button variant="outline" type="button" icon={<RefreshCw size={14} color="#0ea5e9" />} onClick={() => handleRecotizar('Blue')} style={{ color: '#0ea5e9', borderColor: '#0ea5e9' }}>
                  Recotizar productos
                </Button>
              </div>
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
            {mutation.isPending ? 'Guardando...' : 'Guardar Opciones'}
          </Button>
        </div>
      </form>

      {/* Zona de peligro - Fuera del form */}
      <section className={styles.card} style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.02)' }}>
        <div className={styles.cardBody} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={16} /> Vaciar catálogo de productos
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Elimina todos los productos activos. El historial de ventas no se verá afectado.</p>
          </div>
          <Button variant="outline" type="button" onClick={() => setClearCatalogOpen(true)} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
            Vaciar catálogo
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={clearCatalogOpen}
        title="Vaciar catálogo de productos"
        message="Esta acción no se puede deshacer. Se eliminarán permanentemente todos los productos activos de la base de datos."
        confirmLabel="Sí, vaciar catálogo"
        variant="danger"
        onConfirm={handleClearCatalog}
        onCancel={() => setClearCatalogOpen(false)}
      />
    </div>
  );
}
