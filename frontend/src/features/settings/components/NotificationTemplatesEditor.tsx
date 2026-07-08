import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { Button, Input, Modal } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { Pencil, Check, X, MessageSquare, Mail, Smartphone, BellRing } from 'lucide-react';
import { NOTIFICATION_EVENT_LABELS } from '@/features/notifications/constants';
import { NotificationTemplate } from '@/types';

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

  if (isLoading) return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Cargando plantillas...</div>;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {templates.map(tpl => (
        <div key={tpl.id} style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', 
          borderRadius: '8px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--accent)', background: 'var(--bg-overlay)', padding: '8px', borderRadius: '6px' }}>
              {getChannelIcon(tpl.channel)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{getEventName(tpl.event)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Canal: {tpl.channel}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button"
              onClick={() => toggleMutation.mutate({ id: tpl.id, isActive: !tpl.isActive })}
              style={{
                background: tpl.isActive ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-overlay)',
                color: tpl.isActive ? '#10b981' : 'var(--text-muted)',
                border: `1px solid ${tpl.isActive ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`,
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tpl.isActive ? 'Activo' : 'Inactivo'}
            </button>
            <Button variant="secondary" size="sm" onClick={() => setEditingTemplate(tpl)} icon={<Pencil size={14} />}>Editar</Button>
          </div>
        </div>
      ))}

      {editingTemplate && (
        <Modal open={true} title={`Editar Plantilla: ${getEventName(editingTemplate.event)} (${editingTemplate.channel})`} onClose={() => setEditingTemplate(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
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
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Cuerpo del mensaje</label>
              <textarea 
                id="edit-body"
                defaultValue={editingTemplate.body}
                style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
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
