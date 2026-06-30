import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Building2, MapPin, Settings2 } from 'lucide-react';
import clsx from 'clsx';

import { Input, Button } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { generalSettingsSchema, type GeneralSettingsFormData } from '../schemas/generalSettings.schema';
import styles from './GeneralSettingsPanel.module.css';

const TIMEZONES = ['America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Santiago', 'America/Lima', 'America/Mexico_City'];

export function GeneralSettingsPanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('general');

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
  });

  useEffect(() => {
    if (settings?.general) {
      reset(settings.general);
    }
  }, [settings, reset]);

  const onSubmit = (data: GeneralSettingsFormData) => {
    mutation.mutate(data, {
      onSuccess: () => reset(data) 
    });
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando configuraciones...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
      
      {/* 1. Información Fiscal y Comercial */}
      <section className={styles.card} aria-labelledby="fiscal-heading">
        <header className={styles.cardHeader}>
          <h3 id="fiscal-heading" className={styles.cardTitle}>
            <Building2 size={18} aria-hidden="true" />
            Información Fiscal y Comercial
          </h3>
          <p className={styles.cardDescription}>
            Datos oficiales de la empresa. Estos datos aparecerán en los comprobantes y facturas.
          </p>
        </header>
        <div className={styles.cardBody}>
          <div className={clsx(styles.grid, styles.grid2)}>
            <Input 
              label="Nombre Comercial *" 
              {...register('companyName')} 
              error={errors.companyName?.message} 
            />
            <Input 
              label="Razón Social *" 
              {...register('legalName')} 
              error={errors.legalName?.message} 
            />
            <Input 
              label="CUIT / RUT *" 
              placeholder="20-12345678-9"
              {...register('taxId')} 
              error={errors.taxId?.message} 
            />
          </div>
        </div>
      </section>

      {/* 2. Contacto y Localización */}
      <section className={styles.card} aria-labelledby="contact-heading">
        <header className={styles.cardHeader}>
          <h3 id="contact-heading" className={styles.cardTitle}>
            <MapPin size={18} aria-hidden="true" />
            Contacto y Localización
          </h3>
          <p className={styles.cardDescription}>
            Información pública para tus clientes y ubicación de la sede principal.
          </p>
        </header>
        <div className={styles.cardBody}>
          <div className={clsx(styles.grid, styles.grid2)}>
            <Input 
              label="Teléfono" 
              type="tel"
              {...register('phone')} 
              error={errors.phone?.message} 
            />
            <Input 
              label="Email de contacto" 
              type="email" 
              {...register('email')} 
              error={errors.email?.message} 
            />
            <Input 
              label="Sitio Web" 
              type="url"
              placeholder="https://..."
              {...register('website')} 
              error={errors.website?.message} 
              containerClassName={styles.fullWidth}
            />
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
          <div className={clsx(styles.grid, styles.grid2)}>
            <Input label="Dirección" {...register('address')} error={errors.address?.message} />
            <Input label="Ciudad" {...register('city')} error={errors.city?.message} />
            <Input label="Provincia / Estado" {...register('province')} error={errors.province?.message} />
            <Input label="País" {...register('country')} error={errors.country?.message} />
          </div>
        </div>
      </section>

      {/* 3. Preferencias de la Cuenta */}
      <section className={styles.card} aria-labelledby="prefs-heading">
        <header className={styles.cardHeader}>
          <h3 id="prefs-heading" className={styles.cardTitle}>
            <Settings2 size={18} aria-hidden="true" />
            Preferencias Regionales
          </h3>
          <p className={styles.cardDescription}>
            Moneda base y zona horaria para reportes y transacciones.
          </p>
        </header>
        <div className={styles.cardBody}>
          <div className={clsx(styles.grid, styles.grid2)}>
            <div className={styles.selectGroup}>
              <label htmlFor="timezone-select" className={styles.selectLabel}>Zona Horaria</label>
              <select id="timezone-select" {...register('timezone')} className={styles.select}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
              {errors.timezone && <span style={{color: 'var(--red)', fontSize: '12px'}}>{errors.timezone.message}</span>}
            </div>
            
            <div className={styles.selectGroup}>
              <label htmlFor="currency-select" className={styles.selectLabel}>Moneda Base</label>
              <select id="currency-select" {...register('currency')} className={styles.select}>
                <option value="ARS">ARS — Peso Argentino</option>
                <option value="USD">USD — Dólar Estadounidense</option>
                <option value="CLP">CLP — Peso Chileno</option>
              </select>
              {errors.currency && <span style={{color: 'var(--red)', fontSize: '12px'}}>{errors.currency.message}</span>}
            </div>
          </div>
        </div>

        {/* Global Save Footer attached to the last card for better visual flow */}
        <footer className={styles.saveFooter}>
          <Button 
            type="submit" 
            variant="primary" 
            loading={mutation.isPending}
            disabled={!isDirty}
            icon={<Save size={16} />}
            aria-live="polite"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Configuraciones'}
          </Button>
        </footer>
      </section>
    </form>
  );
}
