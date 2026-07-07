import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Drawer, Button, Input } from '@/components/ui';
import { notificationsApi } from '@/api/notifications.api';
import type { NotificationChannel } from '@/types';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_LABELS,
  DEFAULT_PREVIEW_VARIABLES,
} from '../constants';
import styles from './Notifications.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TestForm {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
}

export function TestNotificationDrawer({ open, onClose }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<TestForm>({
    defaultValues: {
      channel: 'WHATSAPP',
      templateKey: 'OTP_CODE',
      recipient: '',
    },
  });

  const channel = watch('channel');

  const sendMutation = useMutation({
    mutationFn: (data: TestForm) =>
      notificationsApi.sendTest({
        ...data,
        variables: DEFAULT_PREVIEW_VARIABLES,
      }),
    onSuccess: (res) => {
      toast.success(res.message);
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al enviar prueba'),
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Enviar Notificación de Prueba"
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit(d => sendMutation.mutate(d))} loading={sendMutation.isPending}>
            Encolar envío
          </Button>
        </>
      }
    >
      <form className={styles.formContainer} onSubmit={handleSubmit(d => sendMutation.mutate(d))} noValidate>
        <div className={styles.formGroup}>
          <label className={styles.label}>Plantilla / Evento</label>
          <select {...register('templateKey')} className={styles.select}>
            {Object.entries(NOTIFICATION_EVENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Canal</label>
          <select {...register('channel')} className={styles.select}>
            {NOTIFICATION_CHANNELS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="Destinatario *"
          placeholder={channel === 'EMAIL' ? 'cliente@email.com' : '5491122334455'}
          {...register('recipient', { required: 'Destinatario requerido' })}
          error={errors.recipient?.message}
        />

        <p className={styles.hintText}>
          Usa variables de ejemplo predefinidas. Requiere plantilla activa y canal habilitado en Settings → Notificaciones.
        </p>
      </form>
    </Drawer>
  );
}
