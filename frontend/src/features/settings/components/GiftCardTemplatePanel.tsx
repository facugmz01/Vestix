import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Gift, Palette } from 'lucide-react';
import clsx from 'clsx';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGiftCardTemplate, useUpdateGiftCardTemplate } from '@/features/gift-cards/hooks/useGiftCardTemplate';
import { giftCardTemplateSchema, type GiftCardTemplateFormData } from '../schemas/giftCardTemplate.schema';
import {
  DEFAULT_GIFT_CARD_TEMPLATE,
  resolveGiftCardTemplate,
} from '@/features/gift-cards/types/giftCardTemplate.types';
import { GiftCardRenderer } from '@/features/gift-cards/components/GiftCardRenderer';
import styles from './SettingsShared.module.css';

const PREVIEW_DATA = {
  amount: '$ 10.000,00',
  code: '52CEA6E48A88',
  recipient: 'Facundo Gomez',
  expiresAt: '31/12/2026',
  verifyUrl: 'https://ejemplo.com/api/gift-cards/verify/demo-token',
};

export function GiftCardTemplatePanel() {
  const { data: templateData, isLoading } = useGiftCardTemplate();
  const mutation = useUpdateGiftCardTemplate();

  const { register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<GiftCardTemplateFormData>({
    resolver: zodResolver(giftCardTemplateSchema),
    defaultValues: DEFAULT_GIFT_CARD_TEMPLATE,
  });

  useEffect(() => {
    if (templateData) {
      reset(resolveGiftCardTemplate(templateData));
    }
  }, [templateData, reset]);

  const previewTemplate = watch();

  const onSubmit = (template: GiftCardTemplateFormData) => {
    mutation.mutate(template, {
      onSuccess: () => reset(template),
    });
  };

  if (isLoading) {
    return <div className={styles.loadingState}>Cargando configuraciones...</div>;
  }

  return (
    <div className={styles.panelContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={clsx(styles.panelContainer, styles.formStatic)} noValidate>
        <div className={clsx(styles.grid, styles.grid2, styles.gridStart)}>
          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Palette size={18} aria-hidden="true" />
                Plantilla de Gift Card
              </h3>
              <p className={styles.cardDescription}>
                Personalizá el diseño de las tarjetas digitales e impresas.
                Los cambios se aplican al emitir o reimprimir gift cards.
              </p>
            </header>

            <div className={styles.cardBody}>
              <Input label="Etiqueta de marca" {...register('brandLabel')} />
              <Input label="Título" {...register('title')} />
              <Input label="Subtítulo (opcional)" {...register('subtitle')} />

              <div className={clsx(styles.grid, styles.grid2)}>
                <Input label="Ancho tarjeta (mm)" type="number" min={50} max={120} {...register('cardWidthMm', { valueAsNumber: true })} />
                <Input label="Alto tarjeta (mm)" type="number" min={40} max={90} {...register('cardHeightMm', { valueAsNumber: true })} />
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Tipografía</label>
                <select {...register('fontFamily')} className={styles.select}>
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monoespaciada</option>
                </select>
              </div>

              <Input label="Tamaño del monto (px)" type="number" min={16} max={48} {...register('amountFontSizePx', { valueAsNumber: true })} />
              <Input label="Radio de bordes (px)" type="number" min={0} max={32} {...register('borderRadiusPx', { valueAsNumber: true })} />

              <div className={styles.colorGrid}>
                <Input label="Color fondo" type="color" {...register('backgroundColor')} />
                <Input label="Color gradiente" type="color" {...register('backgroundGradientEnd')} />
                <Input label="Color texto" type="color" {...register('textColor')} />
                <Input label="Color acento" type="color" {...register('accentColor')} />
              </div>

              <ToggleSwitch label="Usar degradado de fondo" {...register('useGradient')} />
              <ToggleSwitch label="Mostrar logo" {...register('showLogo')} />
              <Input label="URL del logo (opcional)" {...register('logoUrl')} placeholder="/uploads/logos/logo.png" />

              <ToggleSwitch label="Mostrar código QR" {...register('showQr')} />
              <Input label="Tamaño QR (px)" type="number" min={60} max={220} {...register('qrSizePx', { valueAsNumber: true })} />
              <ToggleSwitch label="Mostrar código de tarjeta" {...register('showCode')} />
              <ToggleSwitch label="Mostrar destinatario" {...register('showRecipient')} />
              <ToggleSwitch label="Mostrar vencimiento" {...register('showExpiry')} />

              <div className={styles.textareaGroup}>
                <label className={styles.textareaLabel}>Texto de pie</label>
                <textarea {...register('footerText')} rows={3} className={styles.textarea} />
              </div>

              <Input label="Margen de impresión (mm)" type="number" min={0} max={30} {...register('paperMarginMm', { valueAsNumber: true })} />
            </div>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Gift size={18} aria-hidden="true" />
                Vista previa
              </h3>
              <p className={styles.cardDescription}>
                Así se verá la tarjeta al emitirla o imprimirla.
              </p>
            </header>
            <div className={clsx(styles.cardBody, styles.previewBody)}>
              <div className={styles.previewFrame}>
                <GiftCardRenderer template={resolveGiftCardTemplate(previewTemplate)} data={PREVIEW_DATA} />
              </div>
            </div>
          </section>
        </div>

        <div className={clsx(styles.stickySaveBar, { [styles.visible]: isDirty })}>
          <p className={styles.unsavedText}>Tienes cambios sin guardar</p>
          <Button
            type="submit"
            variant="primary"
            icon={<Save size={16} />}
            loading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar plantilla'}
          </Button>
        </div>
      </form>
    </div>
  );
}
