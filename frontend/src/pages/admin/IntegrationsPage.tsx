import { useState } from 'react';
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

// Provider visual config
const PROVIDER_META: Record<string, { logo: string; color: string; description: string }> = {
  MERCADOPAGO:     { logo: '💳', color: '#00b1ea', description: 'Procesamiento de pagos online y en tienda.' },
  MERCADOLIBRE:    { logo: '🛒', color: '#ffe600', description: 'Sincronización de catálogo y pedidos del marketplace.' },
  AFIP:            { logo: '🏛️', color: '#003a7d', description: 'Facturación electrónica y consulta de padrones.' },
  SENDGRID:        { logo: '📧', color: '#1a82e2', description: 'Envío de emails transaccionales y marketing.' },
  WHATSAPP:        { logo: '💬', color: '#25d366', description: 'Notificaciones via WhatsApp (OpenWA).' },
  WOOCOMMERCE:     { logo: '🛍️', color: '#7f54b3', description: 'Sincronización bidireccional con tienda WordPress.' },
  SHOPIFY:         { logo: '🏪', color: '#96bf48', description: 'Catálogo, stock y pedidos de Shopify.' },
  GENERIC_WEBHOOK: { logo: '🔗', color: '#6b7280', description: 'Webhook genérico para integraciones custom.' },
};

function StatusChip({ status }: { status: string }) {
  switch (status) {
    case 'ACTIVE':         return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--green)', fontSize: '13px', fontWeight: 700 }}><Wifi size={14} /> Activa</div>;
    case 'ERROR':          return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--red)', fontSize: '13px', fontWeight: 700 }}><AlertTriangle size={14} /> Con Error</div>;
    case 'INACTIVE':       return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700 }}><WifiOff size={14} /> Inactiva</div>;
    case 'PENDING_CONFIG': return <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--orange)', fontSize: '13px', fontWeight: 700 }}><Clock size={14} /> Sin Configurar</div>;
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
    onError: (err: any) => toast.error(err.message || 'Error'),
  });

  const handleView = (i: Integration) => { setSelected(i); setDetailOpen(true); };

  const list = integrations ?? [];

  return (
    <PageContainer
      title="Integraciones Externas"
      subtitle="Configura conexiones con plataformas de pago, marketplaces, facturación y canales de mensajería."
    >
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: '180px', borderRadius: '12px', background: 'var(--bg-elevated)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {list.map(integration => {
            const meta = PROVIDER_META[integration.provider] ?? { logo: '🔌', color: '#6b7280', description: '' };
            return (
              <div
                key={integration.id}
                style={{
                  background: 'var(--bg-base)',
                  border: integration.status === 'ERROR' ? '2px solid var(--red)' : '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'box-shadow 0.2s',
                  boxShadow: integration.status === 'ERROR' ? '0 0 0 4px rgba(239,68,68,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {meta.logo}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{integration.name}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{integration.provider}</p>
                    </div>
                  </div>
                  <StatusChip status={integration.status} />
                </div>

                {/* Description */}
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {meta.description}
                </p>

                {/* Last sync */}
                {integration.lastSyncAt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={12} />
                    Sincronizado {new Date(integration.lastSyncAt).toLocaleString()}
                  </div>
                )}

                {/* Error hint */}
                {integration.status === 'PENDING_CONFIG' && (
                  <div style={{ padding: '8px 12px', background: 'var(--orange-bg)', borderRadius: '6px', fontSize: '12px', color: 'var(--orange)', fontWeight: 600 }}>
                    ⚠ Requiere configuración de credenciales para activarse.
                  </div>
                )}
                {integration.status === 'ERROR' && (
                  <div style={{ padding: '8px 12px', background: 'var(--red-bg)', borderRadius: '6px', fontSize: '12px', color: 'var(--red)', fontWeight: 600 }}>
                    ✕ Error de conexión. Revisá las credenciales o logs.
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <Button variant="ghost" size="sm" onClick={() => handleView(integration)} icon={<Eye size={14} />} style={{ flex: 1 }}>
                    Configurar
                  </Button>
                  <ActionGuard action="manage" subject="Settings">
                    <Button
                      variant={integration.status === 'ACTIVE' ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => toggleMutation.mutate({ id: integration.id, isActive: integration.status !== 'ACTIVE' })}
                      loading={toggleMutation.isPending}
                      style={{ flex: 1 }}
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
