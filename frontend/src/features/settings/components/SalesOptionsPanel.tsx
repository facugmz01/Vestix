import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, RefreshCw, Trash2, ShoppingCart, Package, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { Input, Button, ConfirmDialog, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { posSettingsSchema, type PosSettingsFormData } from '../schemas/posSettings.schema';
import { settingsApi } from '@/api/settings.api';
import styles from './SettingsShared.module.css';

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
    return <div className={styles.loadingState}>Cargando configuraciones...</div>;
  }

  return (
    <div className={styles.panelContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={clsx(styles.panelContainer, styles.formStatic)} noValidate>
        
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
            
            <hr className={styles.divider} />
            
            <ToggleSwitch 
              label="Impresión en ticket (80mm)" 
              hint="El formato se adapta a papel de 80mm tipo supermercado. Ideal para térmicas."
              {...register('thermalPrint80mm')} 
            />
            
            <hr className={styles.divider} />
            
            <ToggleSwitch 
              label="Ticket fiscal térmico (70mm)" 
              hint="Agrega botón 'Imprimir fiscal' para formato 70mm con QR AFIP."
              {...register('fiscalPrint70mm')} 
            />
            
            <hr className={styles.divider} />
            
            <div className={clsx(styles.grid, styles.grid2)}>
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Modo de caja</label>
                <select {...register('boxMode')} className={styles.select}>
                  <option value="SHARED">Compartido — cajas comunes</option>
                  <option value="STRICT">Estricto — caja por empleado</option>
                </select>
                <p className={styles.fieldHint}>
                  Compartido: turnos comunes. Estricto: cada empleado abre su turno.
                </p>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Tipo de precio por defecto</label>
                <select {...register('defaultPriceType')} className={styles.select}>
                  <option value="minorista">Minorista</option>
                  <option value="mayorista">Mayorista</option>
                </select>
                <p className={styles.fieldHint}>
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
            <hr className={styles.divider} />
            <ToggleSwitch 
              label="Código de barras obligatorio" 
              {...register('requireBarcode')} 
            />
            <hr className={styles.divider} />
            <ToggleSwitch 
              label="Marca obligatoria" 
              {...register('requireBrand')} 
            />
            <hr className={styles.divider} />
            <ToggleSwitch 
              label="Descripción obligatoria" 
              {...register('requireDescription')} 
            />
            <hr className={styles.divider} />
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
            
            <div className={styles.quoteBlock}>
              <label className={styles.fieldLabel}>Cotización Oficial (ARS por US$1)</label>
              <div className={styles.quoteRow}>
                <div className={styles.inputFixed200}>
                  <Input type="number" prefix="$" placeholder="Ej: 1400" {...register('officialDollarQuote', { valueAsNumber: true })} />
                </div>
                <Button variant="outline" type="button" icon={<RefreshCw size={14} color="#eab308" />} onClick={() => handleRecotizar('Oficial')} className={styles.btnYellowOutline}>
                  Recotizar productos
                </Button>
              </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.quoteBlock}>
              <label className={styles.fieldLabel}>Cotización Blue (ARS por US$1)</label>
              <div className={styles.quoteRow}>
                <div className={styles.inputFixed200}>
                  <Input type="number" prefix="$" placeholder="Ej: 1600" {...register('blueDollarQuote', { valueAsNumber: true })} />
                </div>
                <Button variant="outline" type="button" icon={<RefreshCw size={14} color="#0ea5e9" />} onClick={() => handleRecotizar('Blue')} className={styles.btnCyanOutline}>
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
      <section className={clsx(styles.card, styles.dangerCard)}>
        <div className={clsx(styles.cardBody, styles.dangerCardBody)}>
          <div>
            <h4 className={styles.dangerTitle}>
              <Trash2 size={16} /> Vaciar catálogo de productos
            </h4>
            <p className={styles.dangerHint}>Elimina todos los productos activos. El historial de ventas no se verá afectado.</p>
          </div>
          <Button variant="outline" type="button" onClick={() => setClearCatalogOpen(true)} className={styles.btnDangerOutline}>
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
