import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Receipt, Palette } from 'lucide-react';
import clsx from 'clsx';

import { Input, Button, ToggleSwitch } from '@/components/ui';
import { useGetSettings, useUpdateSettingsSection } from '../hooks/useSettings';
import { receiptStyleSchema, type ReceiptStyleFormData } from '../schemas/receiptStyle.schema';
import { ReceiptPrinter } from '@/features/pos/components/ReceiptPrinter';
import {
  DEFAULT_RECEIPT_STYLE,
  resolveReceiptStyle,
} from '@/features/receipts/types/receiptStyle.types';
import {
  RECEIPT_PREVIEW_BRANCH,
  RECEIPT_PREVIEW_ORDER,
} from '@/features/receipts/constants/receiptPreview';
import styles from './SettingsShared.module.css';

export function ReceiptStylePanel() {
  const { data: settings, isLoading } = useGetSettings();
  const mutation = useUpdateSettingsSection('pos');

  const { register, handleSubmit, reset, watch, control, formState: { isDirty } } = useForm<ReceiptStyleFormData>({
    resolver: zodResolver(receiptStyleSchema),
    defaultValues: DEFAULT_RECEIPT_STYLE,
  });

  useEffect(() => {
    if (settings?.pos?.receiptStyle) {
      reset(resolveReceiptStyle(settings.pos.receiptStyle));
    }
  }, [settings, reset]);

  const previewStyle = watch();

  const onSubmit = (receiptStyle: ReceiptStyleFormData) => {
    const currentPos = settings?.pos;
    if (!currentPos) return;

    mutation.mutate(
      { ...currentPos, receiptStyle },
      { onSuccess: () => reset(receiptStyle) },
    );
  };

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando configuraciones...</div>;
  }

  return (
    <div className={styles.panelContainer}>
      <form onSubmit={handleSubmit(onSubmit)} className={styles.panelContainer} style={{ animation: 'none', gap: 'var(--space-6)' }} noValidate>
        <div className={clsx(styles.grid, styles.grid2)} style={{ alignItems: 'start' }}>
          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Palette size={18} aria-hidden="true" />
                Estilo del comprobante
              </h3>
              <p className={styles.cardDescription}>
                Personalizá el ticket de venta para POS, impresión y el link público del comprobante.
                El encabezado y pie por sucursal se configuran en Sucursales.
              </p>
            </header>

            <div className={styles.cardBody}>
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Ancho de papel</label>
                <select {...register('paperWidthMm', { valueAsNumber: true })} className={styles.select}>
                  <option value={58}>58 mm (mini térmica)</option>
                  <option value={70}>70 mm (fiscal)</option>
                  <option value={80}>80 mm (estándar)</option>
                </select>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Tipografía</label>
                <select {...register('fontFamily')} className={styles.select}>
                  <option value="monospace">Monoespaciada (ticket clásico)</option>
                  <option value="sans-serif">Sans-serif (moderna)</option>
                  <option value="serif">Serif (formal)</option>
                </select>
              </div>

              <div className={clsx(styles.grid, styles.grid2)}>
                <Input label="Tamaño de texto" type="number" min={9} max={18} {...register('fontSizePx', { valueAsNumber: true })} />
                <Input label="Tamaño encabezado" type="number" min={10} max={24} {...register('headerFontSizePx', { valueAsNumber: true })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
                <Input label="Color texto" type="color" {...register('textColor')} />
                <Input label="Color fondo" type="color" {...register('backgroundColor')} />
                <Input label="Color acento" type="color" {...register('accentColor')} />
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.selectLabel}>Separadores</label>
                <select {...register('dividerStyle')} className={styles.select}>
                  <option value="dashed">Guiones</option>
                  <option value="solid">Línea sólida</option>
                  <option value="dotted">Punteada</option>
                  <option value="none">Sin separadores</option>
                </select>
              </div>

              <Input label="Título por defecto (sin cabecera de sucursal)" {...register('titleFallback')} />
              <Input label="URL del logo (opcional)" placeholder="https://..." {...register('logoUrl')} />

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

              <ToggleSwitch label="Mostrar fecha y hora" {...register('showDate')} />
              <ToggleSwitch label="Mostrar número de ticket" {...register('showTicketNumber')} />
              <ToggleSwitch label="Mostrar cliente" {...register('showCustomer')} />
              <ToggleSwitch label="Mostrar SKU por línea" {...register('showSku')} />
              <ToggleSwitch label="Mostrar descuentos por línea" {...register('showLineDiscounts')} />
              <ToggleSwitch label="Mostrar subtotal" {...register('showSubtotal')} />
              <ToggleSwitch label="Mostrar medio de pago" {...register('showPaymentMethod')} />
            </div>
          </section>

          <section className={styles.card}>
            <header className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Receipt size={18} aria-hidden="true" />
                Vista previa
              </h3>
              <p className={styles.cardDescription}>Así verá el cliente el comprobante al abrir el link o al imprimir.</p>
            </header>
            <div className={styles.cardBody} style={{ display: 'flex', justifyContent: 'center', background: 'var(--bg-base)' }}>
              <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', maxWidth: '100%' }}>
                <ReceiptPrinter
                  order={RECEIPT_PREVIEW_ORDER}
                  branchSettings={RECEIPT_PREVIEW_BRANCH}
                  receiptStyle={previewStyle}
                />
              </div>
            </div>
          </section>
        </div>

        <div className={clsx(styles.stickySaveBar, { [styles.visible]: isDirty })}>
          <p className={styles.unsavedText}>Tienes cambios sin guardar</p>
          <Button
            type="submit"
            variant="primary"
            loading={mutation.isPending}
            disabled={!isDirty || mutation.isPending}
            icon={<Save size={16} />}
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar estilo del comprobante'}
          </Button>
        </div>
      </form>
    </div>
  );
}
