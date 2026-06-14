import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Drawer, Button, Input } from '@/components/ui';
import { notificationsApi, type CreateTemplateDto } from '@/api/notifications.api';
import { queryKeys } from '@/api/queryKeys';
import type { NotificationTemplate, NotificationChannel, NotificationEvent } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  template?: NotificationTemplate | null;
}

const EVENTS: { value: NotificationEvent; label: string }[] = [
  { value: 'SALE_CONFIRMED', label: 'Venta Confirmada' },
  { value: 'PURCHASE_ORDER_ISSUED', label: 'Orden de Compra Emitida' },
  { value: 'GOODS_RECEIPT_RECEIVED', label: 'Recepción de Mercadería' },
  { value: 'LOW_STOCK_ALERT', label: 'Alerta de Stock Bajo' },
  { value: 'TRANSFER_DISPATCHED', label: 'Transferencia Despachada' },
  { value: 'TRANSFER_RECEIVED', label: 'Transferencia Recibida' },
  { value: 'INVOICE_ISSUED', label: 'Factura Emitida' },
  { value: 'PAYMENT_RECEIVED', label: 'Pago Registrado' },
  { value: 'RETURN_APPROVED', label: 'Devolución Aprobada' },
];

const CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'PUSH', label: 'Push (App Móvil)' },
];

const TEMPLATE_VARS = [
  '{{customerName}}', '{{orderNumber}}', '{{amount}}', '{{date}}',
  '{{productName}}', '{{trackingNumber}}', '{{invoiceNumber}}', '{{branchName}}',
];

export function TemplateFormDrawer({ open, onClose, template }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!template;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateTemplateDto>({
    defaultValues: {
      name: template?.name ?? '',
      event: template?.event ?? 'SALE_CONFIRMED',
      channel: template?.channel ?? 'EMAIL',
      subject: template?.subject ?? '',
      body: template?.body ?? '',
      isActive: template?.isActive ?? true,
    }
  });

  const watchedChannel = watch('channel');

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
    const current = watch('body');
    setValue('body', current + v);
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
          <Button variant="primary" onClick={handleSubmit(d => mutation.mutate(d))} loading={mutation.isPending}>
            {isEdit ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </>
      }
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <Input
          label="Nombre Interno *"
          placeholder="Ej: Email Confirmación de Venta"
          {...register('name', { required: 'Requerido' })}
          error={errors.name?.message}
        />

        <div className="grid-responsive grid-cols-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Evento Disparador *</label>
            <select {...register('event')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
              {EVENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Canal de Envío *</label>
            <select {...register('channel')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
              {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {watchedChannel === 'EMAIL' && (
          <Input
            label="Asunto del Email *"
            placeholder="Ej: Tu compra fue confirmada ✓"
            {...register('subject', { required: watchedChannel === 'EMAIL' ? 'Requerido para Email' : false })}
            error={errors.subject?.message}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Cuerpo del Mensaje *</label>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Variables disponibles:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {TEMPLATE_VARS.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => insertVar(v)}
                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--accent)', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: '12px', cursor: 'pointer', fontFamily: 'monospace' }}
              >
                {v}
              </button>
            ))}
          </div>
          <textarea
            rows={6}
            placeholder={watchedChannel === 'EMAIL'
              ? 'Hola {{customerName}}, tu pedido {{orderNumber}} fue confirmado...'
              : 'Tu pedido {{orderNumber}} ha sido confirmado por ${{amount}}.'}
            {...register('body', { required: 'El cuerpo es obligatorio' })}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', fontFamily: 'monospace', resize: 'vertical' }}
          />
          {errors.body && <p style={{ color: 'var(--red)', fontSize: '12px', margin: 0 }}>{errors.body.message}</p>}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <input type="checkbox" {...register('isActive')} />
          <span style={{ fontWeight: 600 }}>Plantilla Activa</span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>— Si está desactivada, el evento no enviará notificaciones.</span>
        </label>

      </form>
    </Drawer>
  );
}
