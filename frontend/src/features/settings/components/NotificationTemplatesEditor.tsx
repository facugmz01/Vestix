import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { Pencil, MessageSquare, Mail, Smartphone, BellRing } from 'lucide-react';
import clsx from 'clsx';
import { NOTIFICATION_EVENT_LABELS } from '@/features/notifications/constants';
import { NotificationTemplate } from '@/types';
import styles from './SettingsShared.module.css';

export function NotificationTemplatesEditor() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['notificationTemplates'],
    queryFn: () => notificationsApi.getTemplates({ pageSize: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; subject?: string; body: string }) => notificationsApi.updateTemplate(data.id, { subject: data.subject, body: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
      toast.success('Plantilla actualizada');
      setEditingTemplate(null);
    },
    onError: () => toast.error('Error al actualizar la plantilla'),
  });

  const toggleMutation = useMutation({
    mutationFn: (data: { id: string; isActive: boolean }) => notificationsApi.toggleTemplate(data.id, data.isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationTemplates'] });
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const templates = data?.data || [];

  if (isLoading) return <div className={styles.loadingState}>Cargando plantillas...</div>;

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'EMAIL': return <Mail size={16} />;
      case 'WHATSAPP': return <MessageSquare size={16} />;
      case 'SMS': return <Smartphone size={16} />;
      default: return <BellRing size={16} />;
    }
  };

  const getEventName = (event: string) => NOTIFICATION_EVENT_LABELS[event] || event;

  return (
    <div className={styles.templateList}>
      {templates.map(tpl => (
        <div key={tpl.id} className={styles.templateRow}>
          <div className={styles.templateMain}>
            <div className={styles.templateIcon}>
              {getChannelIcon(tpl.channel)}
            </div>
            <div>
              <div className={styles.templateTitle}>{getEventName(tpl.event)}</div>
              <div className={styles.templateMeta}>Canal: {tpl.channel}</div>
            </div>
          </div>
          
          <div className={styles.templateActions}>
            <button 
              type="button"
              onClick={() => toggleMutation.mutate({ id: tpl.id, isActive: !tpl.isActive })}
              className={clsx(styles.statusToggle, { [styles.statusToggleActive]: tpl.isActive })}
            >
              {tpl.isActive ? 'Activo' : 'Inactivo'}
            </button>
            <Button variant="secondary" size="sm" onClick={() => setEditingTemplate(tpl)} icon={<Pencil size={14} />}>Editar</Button>
          </div>
        </div>
      ))}

      {editingTemplate && (
        <Modal open={true} title={`Editar Plantilla: ${getEventName(editingTemplate.event)} (${editingTemplate.channel})`} onClose={() => setEditingTemplate(null)}>
          <div className={styles.modalForm}>
            <p className={styles.modalHint}>
              Variables disponibles: {'{customerName}'}, {'{orderId}'}, {'{total}'}, {'{trackingNumber}'}, {'{productName}'}, {'{quantity}'}.
            </p>
            {editingTemplate.channel === 'EMAIL' && (
              <Input 
                label="Asunto" 
                defaultValue={editingTemplate.subject || ''} 
                id="edit-subject"
              />
            )}
            <div>
              <label className={styles.fieldLabel}>Cuerpo del mensaje</label>
              <textarea 
                id="edit-body"
                defaultValue={editingTemplate.body}
                className={styles.modalTextarea}
              />
            </div>
            
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setEditingTemplate(null)}>Cancelar</Button>
              <Button 
                onClick={() => {
                  const body = (document.getElementById('edit-body') as HTMLTextAreaElement).value;
                  const subjectInput = document.getElementById('edit-subject') as HTMLInputElement | null;
                  updateMutation.mutate({ 
                    id: editingTemplate.id, 
                    body,
                    subject: subjectInput ? subjectInput.value : undefined
                  });
                }}
                loading={updateMutation.isPending}
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
