import { useState } from 'react';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wifi, WifiOff, AlertTriangle, Clock, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Button, Badge
} from '@/components/ui';
import { integrationsApi } from '@/api/integrations.api';
import { queryKeys } from '@/api/queryKeys';
import type { Integration } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';
import { IntegrationDetailDrawer } from '@/features/integrations/components/IntegrationDetailDrawer';
import styles from './IntegrationsPage.module.css';

const PROVIDER_META: Record<string, { logo: string; description: string; iconClass: string }> = {
  MERCADOPAGO:     { logo: '💳', description: 'Procesamiento de pagos online y en tienda.', iconClass: styles.providerMercadopago },
  MERCADOLIBRE:    { logo: '🛒', description: 'Sincronización de catálogo y pedidos del marketplace.', iconClass: styles.providerMercadolibre },
  AFIP:            { logo: '🏛️', description: 'Facturación electrónica y consulta de padrones.', iconClass: styles.providerAfip },
  SENDGRID:        { logo: '📧', description: 'Envío de emails transaccionales y marketing.', iconClass: styles.providerSendgrid },
  WHATSAPP:        { logo: '💬', description: 'Notificaciones via WhatsApp (Evolution API).', iconClass: styles.providerWhatsapp },
  WOOCOMMERCE:     { logo: '🛍️', description: 'Sincronización bidireccional con tienda WordPress.', iconClass: styles.providerWoocommerce },
  SHOPIFY:         { logo: '🏪', description: 'Catálogo, stock y pedidos de Shopify.', iconClass: styles.providerShopify },
  GENERIC_WEBHOOK: { logo: '🔗', description: 'Webhook genérico para integraciones custom.', iconClass: styles.providerGeneric },
};

function StatusChip({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':         return <div className={styles.statusActive}><Wifi size={14} /> Activa</div>;
    case 'ERROR':          return <div className={styles.statusError}><AlertTriangle size={14} /> Con Error</div>;
    case 'INACTIVE':       return <div className={styles.statusInactive}><WifiOff size={14} /> Inactiva</div>;
    case 'PENDING_CONFIG': return <div className={styles.statusPending}><Clock size={14} /> Sin Configurar</div>;
    default:               return <Badge color="gray">{status}</Badge>;
  }
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Integration | null>(null);

  const { data: integrations, isLoading } = useQuery({
    queryKey: queryKeys.integrations.all(),
    queryFn: () => integrationsApi.getAll(),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      integrationsApi.toggleActive(id, isActive),
    onSuccess: () => {
      toast.success('Estado actualizado');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all() });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error'),
  });

  const handleView = (i: Integration) => { setSelected(i); setDetailOpen(true); };

  const list = integrations ?? [];

  return (
    <PageContainer
      title="Integraciones Externas"
      subtitle="Configura conexiones con plataformas de pago, marketplaces, facturación y canales de mensajería."
    >
      {isLoading ? (
        <div className={styles.integrationGrid}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={styles.integrationSkeleton} />
          ))}
        </div>
      ) : (
        <div className={styles.integrationGrid}>
          {list.map(integration => {
            const meta = PROVIDER_META[integration.provider] ?? {
              logo: '🔌',
              description: '',
              iconClass: styles.providerGeneric,
            };
            return (
              <div
                key={integration.id}
                className={clsx(styles.integrationCard, integration.status === 'ERROR' && styles.integrationCardError)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitleRow}>
                    <div className={clsx(styles.providerIcon, meta.iconClass)}>
                      {meta.logo}
                    </div>
                    <div>
                      <h3 className={styles.integrationName}>{integration.name}</h3>
                      <p className={styles.integrationProvider}>{integration.provider}</p>
                    </div>
                  </div>
                  <StatusChip status={integration.status} />
                </div>

                <p className={styles.integrationDesc}>
                  {meta.description}
                </p>

                {integration.lastSyncAt && (
                  <div className={styles.syncRow}>
                    <RefreshCw size={12} />
                    Sincronizado {new Date(integration.lastSyncAt).toLocaleString()}
                  </div>
                )}

                {integration.status === 'PENDING_CONFIG' && (
                  <div className={styles.hintOrange}>
                    ⚠ Requiere configuración de credenciales para activarse.
                  </div>
                )}
                {integration.status === 'ERROR' && (
                  <div className={styles.hintRed}>
                    ✕ Error de conexión. Revisá las credenciales o logs.
                  </div>
                )}

                <div className={styles.cardActions}>
                  <Button variant="ghost" size="sm" onClick={() => handleView(integration)} icon={<Eye size={14} />} className={styles.btnFlex}>
                    Configurar
                  </Button>
                  <ActionGuard action="manage" subject="Settings">
                    <Button
                      variant={integration.status === 'ACTIVE' ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: integration.id, isActive: integration.status !== 'ACTIVE' })}
                      loading={toggleMutation.isPending}
                      className={styles.btnFlex}
                    >
                      {integration.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                    </Button>
                  </ActionGuard>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <IntegrationDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        integration={selected}
      />
    </PageContainer>
  );
}
