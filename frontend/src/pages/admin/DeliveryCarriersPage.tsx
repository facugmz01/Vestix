import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Truck } from 'lucide-react';
import clsx from 'clsx';

import { DELIVERY_TABS } from '@/navigation/moduleTabs';
import { PageContainer, Section, Button, Input, ToggleSwitch, Tabs } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '@/features/settings/hooks/useSettings';
import {
  storefrontSettingsSchema,
  type StorefrontSettingsFormData,
} from '@/features/settings/schemas/storefrontSettings.schema';
import styles from '@/features/settings/components/SettingsShared.module.css';
import adminStyles from '@/styles/AdminListShared.module.css';

export default function DeliveryCarriersPage() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('storefront');

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm<StorefrontSettingsFormData>({
    resolver: zodResolver(storefrontSettingsSchema),
  });

  useEffect(() => {
    if (settings?.storefront) reset(settings.storefront);
  }, [settings, reset]);

  const onSubmit = (data: StorefrontSettingsFormData) => {
    mutation.mutate(data, { onSuccess: () => reset(data) });
  };

  if (isLoading) return null;

  return (
    <PageContainer
      tabs={<Tabs items={DELIVERY_TABS} />}
      title="Carriers"
      subtitle="Configurá integraciones con Andreani y Mercado Envíos para despachos automáticos."
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} noValidate>
        <Section>
          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}><Truck size={18} /> Andreani</h3>
              <p className={styles.cardDescription}>Genera envíos y etiquetas al despachar con carrier Andreani.</p>
            </header>
            <div className={styles.cardBody}>
              <ToggleSwitch label="Habilitado" {...register('deliverySettings.carriers.andreani.enabled')} />
              <div className={clsx(styles.grid, styles.grid2, adminStyles.mtSm)}>
                <Input label="API Key" type="password" {...register('deliverySettings.carriers.andreani.apiKey')} />
                <Input label="Client ID" {...register('deliverySettings.carriers.andreani.clientId')} />
                <Input label="Número de contrato" {...register('deliverySettings.carriers.andreani.contract')} />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}><Truck size={18} /> Mercado Envíos</h3>
              <p className={styles.cardDescription}>Crea etiquetas de Mercado Envíos al confirmar el despacho.</p>
            </header>
            <div className={styles.cardBody}>
              <ToggleSwitch label="Habilitado" {...register('deliverySettings.carriers.mercadoEnvios.enabled')} />
              <div className={clsx(styles.grid, styles.grid2, adminStyles.mtSm)}>
                <Input label="Access Token" type="password" {...register('deliverySettings.carriers.mercadoEnvios.accessToken')} />
                <Input label="User ID" {...register('deliverySettings.carriers.mercadoEnvios.userId')} />
              </div>
            </div>
          </section>
        </Section>

        <div className={clsx(styles.stickySaveBar, { [styles.visible]: isDirty })}>
          <p className={styles.unsavedText}>Tienes cambios sin guardar</p>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
            icon={<Save size={16} />}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar Carriers'}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
