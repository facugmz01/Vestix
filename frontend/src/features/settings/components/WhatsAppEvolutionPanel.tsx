import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, RefreshCw, Link2, QrCode, Copy } from 'lucide-react';

import clsx from 'clsx';

import { Button } from '@/components/ui';
import { notificationsApi } from '@/api/notifications.api';
import styles from './SettingsShared.module.css';

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
    <div className={clsx(styles.configPanel, styles.whatsAppPanel)}>
      <div className={styles.whatsAppHeader}>
        <div>
          <p className={styles.whatsAppTitle}>Vinculación WhatsApp (Evolution)</p>
          <p className={styles.whatsAppMeta}>
            Instancia: <code>{status?.instance ?? '—'}</code>
            {status?.state && (
              <> · Estado: <strong>{status.state}</strong></>
            )}
          </p>
        </div>
        <div className={styles.whatsAppActions}>
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
        <p className={styles.textMutedSm}>Consultando estado…</p>
      ) : status?.state === 'not_configured' ? (
        <p className={styles.textMutedSm}>
          Guardá la URL, API Key e instancia de Evolution y probá la conexión antes de vincular.
        </p>
      ) : status?.isReady ? (
        <div className={styles.connectedBanner}>
          <CheckCircle size={28} color="#25D366" />
          <div>
            <p className={styles.connectedTitle}>Sesión activa</p>
            <p className={styles.connectedText}>
              WhatsApp está listo para enviar notificaciones.
            </p>
          </div>
        </div>
      ) : status?.qrCode ? (
        <div className={styles.qrSection}>
          <p className={styles.qrHint}>
            Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo y escaneá el código.
          </p>
          <div className={styles.qrWhiteFrame}>
            <img src={status.qrCode} alt="QR WhatsApp" className={styles.qrLargeImage} />
          </div>
          <p className={styles.qrRefreshHint}>
            El QR se actualiza automáticamente cada pocos segundos.
          </p>
        </div>
      ) : (
        <p className={styles.textMutedSm}>
          Presioná &quot;Conectar / QR&quot; para iniciar el emparejamiento con Evolution API.
        </p>
      )}

      {status?.webhookUrl && (
        <div className={styles.webhookBox}>
          <p className={styles.webhookLabel}>
            Webhook de entrega (configurar en Evolution)
          </p>
          <div className={styles.webhookRow}>
            <code className={styles.webhookCode}>{status.webhookUrl}</code>
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
          <p className={styles.webhookHint}>
            Si usás <code>EVOLUTION_WEBHOOK_SECRET</code>, Evolution debe enviar ese valor en el header <code>apikey</code>.
          </p>
        </div>
      )}
    </div>
  );
}
