import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, RefreshCw, Link2, QrCode, Copy } from 'lucide-react';

import { Button } from '@/components/ui';
import { notificationsApi } from '@/api/notifications.api';

interface Props {
  enabled: boolean;
}

export function WhatsAppEvolutionPanel({ enabled }: Props) {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const { data: status, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => notificationsApi.getWhatsAppStatus(),
    enabled,
    refetchInterval: (query) => {
      if (!enabled) return false;
      const s = query.state.data;
      if (!s?.configured) return false;
      return s.isReady ? false : 4000;
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => notificationsApi.connectWhatsApp(),
    onSuccess: (data) => {
      queryClient.setQueryData(['whatsapp', 'status'], data);
      if (data.isReady) {
        toast.success('WhatsApp conectado y listo para enviar');
      } else if (data.qrCode) {
        toast.success('Escaneá el código QR con tu teléfono');
      } else {
        toast('Iniciando sesión de WhatsApp…', { icon: '📱' });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Error al conectar');
    },
    onSettled: () => setConnecting(false),
  });

  const webhookMutation = useMutation({
    mutationFn: () => notificationsApi.configureWhatsAppWebhook(),
    onSuccess: (data) => toast.success(data.message || 'Webhook configurado'),
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || 'Error al configurar webhook');
    },
  });

  const handleConnect = () => {
    setConnecting(true);
    connectMutation.mutate();
  };

  const copyWebhookUrl = async () => {
    if (!status?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(status.webhookUrl);
      toast.success('URL copiada al portapapeles');
    } catch {
      toast.error('No se pudo copiar la URL');
    }
  };

  if (!enabled) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 16,
        background: 'var(--bg-surface-hover)',
        borderRadius: 8,
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Vinculación WhatsApp (Evolution)</p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Instancia: <code>{status?.instance ?? '—'}</code>
            {status?.state && (
              <> · Estado: <strong>{status.state}</strong></>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            type="button"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
            loading={isFetching && !connecting}
          >
            Actualizar
          </Button>
          <Button
            variant="primary"
            type="button"
            size="sm"
            icon={<QrCode size={14} />}
            onClick={handleConnect}
            loading={connectMutation.isPending}
            disabled={!status?.configured && status?.state !== 'not_configured' ? false : status?.isReady}
          >
            {status?.isReady ? 'Conectado' : 'Conectar / QR'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Consultando estado…</p>
      ) : status?.state === 'not_configured' ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
          Guardá la URL, API Key e instancia de Evolution y probá la conexión antes de vincular.
        </p>
      ) : status?.isReady ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'rgba(37,211,102,0.08)', borderRadius: 8 }}>
          <CheckCircle size={28} color="#25D366" />
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>Sesión activa</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              WhatsApp está listo para enviar notificaciones.
            </p>
          </div>
        </div>
      ) : status?.qrCode ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo y escaneá el código.
          </p>
          <div style={{ padding: 12, background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <img src={status.qrCode} alt="QR WhatsApp" style={{ width: 220, height: 220, display: 'block' }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
            El QR se actualiza automáticamente cada pocos segundos.
          </p>
        </div>
      ) : (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
          Presioná &quot;Conectar / QR&quot; para iniciar el emparejamiento con Evolution API.
        </p>
      )}

      {status?.webhookUrl && (
        <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
            Webhook de entrega (configurar en Evolution)
          </p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <code style={{ fontSize: 11, wordBreak: 'break-all', flex: 1 }}>{status.webhookUrl}</code>
            <Button variant="ghost" type="button" size="sm" icon={<Copy size={12} />} onClick={copyWebhookUrl}>
              Copiar
            </Button>
            <Button
              variant="outline"
              type="button"
              size="sm"
              icon={<Link2 size={12} />}
              onClick={() => webhookMutation.mutate()}
              loading={webhookMutation.isPending}
            >
              Auto-configurar
            </Button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
            Si usás <code>EVOLUTION_WEBHOOK_SECRET</code>, Evolution debe enviar ese valor en el header <code>apikey</code>.
          </p>
        </div>
      )}
    </div>
  );
}
