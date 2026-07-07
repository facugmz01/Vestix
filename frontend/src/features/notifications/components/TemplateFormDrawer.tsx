import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import { Drawer, Button, Input } from '@/components/ui';
import { notificationsApi, type CreateTemplateDto } from '@/api/notifications.api';
import { queryKeys } from '@/api/queryKeys';
import type { NotificationTemplate, NotificationChannel } from '@/types';
import { templateSchema, type TemplateFormData } from '../schemas/template.schema';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_LABELS,
  TEMPLATE_VARIABLES_BY_EVENT,
} from '../constants';
import styles from './Notifications.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  template?: NotificationTemplate | null;
}

const EVENTS = Object.entries(NOTIFICATION_EVENT_LABELS).map(([value, label]) => ({ value, label }));
const CHANNELS = NOTIFICATION_CHANNELS;

export function TemplateFormDrawer({ open, onClose, template }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!template;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name:     template?.name     ?? '',
      event:    template?.event    ?? 'SALE_CONFIRMED',
      channel:  template?.channel  ?? 'EMAIL',
      subject:  template?.subject  ?? '',
      body:     template?.body     ?? '',
      isActive: template?.isActive ?? true,
    }
  });

  // Reset form values whenever the template prop changes (open in edit / switch between templates)
  useEffect(() => {
    reset({
      name:     template?.name     ?? '',
      event:    template?.event    ?? 'SALE_CONFIRMED',
      channel:  template?.channel  ?? 'EMAIL',
      subject:  template?.subject  ?? '',
      body:     template?.body     ?? '',
      isActive: template?.isActive ?? true,
    });
  }, [template, reset]);

  const watchedChannel = watch('channel');
  const watchedEvent = watch('event');
  const templateVars = TEMPLATE_VARIABLES_BY_EVENT[watchedEvent] ?? ['{{customerName}}'];

  const mutation = useMutation({
    mutationFn: (data: CreateTemplateDto) =>
      isEdit
        ? notificationsApi.updateTemplate(template.id, data)
        : notificationsApi.createTemplate(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Plantilla actualizada' : 'Plantilla creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.templates() });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al guardar'),
  });

  const insertVar = (v: string) => {
    const current = watch('body') || '';
    setValue('body', current + v, { shouldValidate: true });
  };

  const onSubmit = (data: TemplateFormData) => {
    mutation.mutate(data as CreateTemplateDto);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Editar Plantilla' : 'Nueva Plantilla de Notificación'}
      width="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={mutation.isPending}>
            {isEdit ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer} noValidate>

        <Input
          label="Nombre Interno *"
          placeholder="Ej: Email Confirmación de Venta"
          {...register('name')}
          error={errors.name?.message}
        />

        <div className="grid-responsive grid-cols-2">
          <div className={styles.formGroup}>
            <label className={styles.label}>Evento Disparador *</label>
            <select {...register('event')} className={clsx(styles.select, errors.event && styles.textareaError)}>
              {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
            {errors.event && <p className={styles.errorText}>{errors.event.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Canal de Envío *</label>
            <select {...register('channel')} className={clsx(styles.select, errors.channel && styles.textareaError)}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.channel && <p className={styles.errorText}>{errors.channel.message}</p>}
          </div>
        </div>

        {watchedChannel === 'EMAIL' && (
          <Input
            label="Asunto del Email *"
            placeholder="Ej: Tu compra fue confirmada ✓"
            {...register('subject')}
            error={errors.subject?.message}
          />
        )}

        <div className={styles.formGroup}>
          <div className={styles.variablesHeader}>
            <label className={styles.label}>Cuerpo del Mensaje *</label>
            <span className={styles.variablesLabel}>Variables disponibles:</span>
          </div>
          <div className={styles.variablesContainer}>
            {templateVars.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVar(v)}
                className={styles.variableButton}
              >
                {v}
              </button>
            ))}
          </div>
          <textarea
            rows={6}
            placeholder={watchedChannel === 'EMAIL'
              ? 'Hola {{customerName}}, tu pedido {{orderId}} fue confirmado por ${{total}}.'
              : 'Tu código es {{otpCode}}'}
            {...register('body')}
            className={clsx(styles.textarea, errors.body && styles.textareaError)}
          />
          {errors.body && <p className={styles.errorText}>{errors.body.message}</p>}
        </div>

        <label className={styles.checkboxContainer}>
          <input type="checkbox" {...register('isActive')} />
          <span className={styles.checkboxLabel}>Plantilla Activa</span>
          <span className={styles.checkboxHint}>— Si está desactivada, el evento no enviará notificaciones.</span>
        </label>

      </form>
    </Drawer>
  );
}
