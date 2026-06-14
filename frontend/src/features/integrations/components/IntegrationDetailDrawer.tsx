import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  RefreshCw, TestTube, Eye, EyeOff, Save, CheckCircle,
  AlertTriangle, Clock, XCircle, Wifi, WifiOff, RotateCcw
} from 'lucide-react';

import { Drawer, Button, Table, Badge } from '@/components/ui';
import { integrationsApi } from '@/api/integrations.api';
import { queryKeys } from '@/api/queryKeys';
import { notificationsApi } from '@/api/notifications.api';
import type { Integration, WebhookLog } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

interface Props {
  open: boolean;
  onClose: () => void;
  integration: Integration | null;
}

// Config field definitions per provider
const PROVIDER_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean }[]> = {
  MERCADOPAGO: [
    { key: 'publicKey', label: 'Public Key', placeholder: 'APP_USR-...', secret: false },
    { key: 'accessToken', label: 'Access Token', placeholder: 'APP_USR-...', secret: true },
    { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'mp_secret_...', secret: true },
  ],
  MERCADOLIBRE: [
    { key: 'clientId', label: 'Client ID', placeholder: '123456' },
    { key: 'clientSecret', label: 'Client Secret', placeholder: 'xxxxxxxx', secret: true },
    { key: 'refreshToken', label: 'Refresh Token', placeholder: 'TG-...', secret: true },
  ],
  AFIP: [
    { key: 'cuit', label: 'CUIT Empresa', placeholder: '20-xxxxxxxx-x' },
    { key: 'certPath', label: 'Ruta Certificado (.crt)', placeholder: '/certs/afip.crt' },
    { key: 'keyPath', label: 'Ruta Clave Privada (.key)', placeholder: '/certs/afip.key' },
    { key: 'environment', label: 'Ambiente', placeholder: 'homologation | production' },
  ],
  SENDGRID: [
    { key: 'apiKey', label: 'API Key', placeholder: 'SG.xxx', secret: true },
    { key: 'fromEmail', label: 'Email Remitente', placeholder: 'no-reply@tuempresa.com' },
    { key: 'fromName', label: 'Nombre Remitente', placeholder: 'Tu Empresa ERP' },
  ],
  WHATSAPP: [
    { key: 'sessionName', label: 'Nombre de Sesión', placeholder: 'erp-main-session' },
  ],
  WOOCOMMERCE: [
    { key: 'storeUrl', label: 'URL de la Tienda', placeholder: 'https://mitienda.com' },
    { key: 'consumerKey', label: 'Consumer Key', placeholder: 'ck_...' },
    { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'cs_...', secret: true },
  ],
  SHOPIFY: [
    { key: 'shopDomain', label: 'Shop Domain', placeholder: 'mi-tienda.myshopify.com' },
    { key: 'apiKey', label: 'API Key', placeholder: 'xxxxxxxx' },
    { key: 'apiSecret', label: 'API Secret', placeholder: 'xxxxxxxx', secret: true },
    { key: 'accessToken', label: 'Admin Access Token', placeholder: 'shpat_...', secret: true },
  ],
  GENERIC_WEBHOOK: [
    { key: 'targetUrl', label: 'Target URL', placeholder: 'https://...' },
    { key: 'secretHeader', label: 'Header Secreto (X-Secret)', placeholder: 'xxxxxxxx', secret: true },
  ],
};

export function IntegrationDetailDrawer({ open, onClose, integration }: Props) {
  const queryClient = useQueryClient();
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [logsPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'config' | 'webhooks' | 'failed-afip' | 'mappings' | 'qr'>('config');

  // Variant Mapping UI States
  const [variantSearch, setVariantSearch] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [wcProductId, setWcProductId] = useState('');
  const [wcVariationId, setWcVariationId] = useState('');

  const fields = integration ? (PROVIDER_FIELDS[integration.provider] ?? []) : [];

  const { data: webhookData, isLoading: isLoadingLogs } = useQuery({
    queryKey: queryKeys.integrations.webhookLogs(integration?.id || '', { page: logsPage }),
    queryFn: () => integrationsApi.getWebhookLogs(integration!.id, { page: logsPage, pageSize: 10 }),
    enabled: open && !!integration && activeTab === 'webhooks',
  });

  const { data: failedAfipJobs, isLoading: isLoadingFailedAfip } = useQuery({
    queryKey: queryKeys.integrations.failedAfipJobs(),
    queryFn: () => integrationsApi.getFailedAfipJobs(),
    enabled: open && !!integration && integration.provider === 'AFIP' && activeTab === 'failed-afip',
  });

  const { data: mappingsData, isLoading: isLoadingMappings } = useQuery({
    queryKey: ['integrations', 'woocommerce', 'mappings'],
    queryFn: () => integrationsApi.getWcMappings(),
    enabled: open && !!integration && integration.provider === 'WOOCOMMERCE' && activeTab === 'mappings',
  });

  const { data: searchedVariants } = useQuery({
    queryKey: ['variants', 'search', variantSearch],
    queryFn: () => integrationsApi.searchVariants(variantSearch),
    enabled: variantSearch.length >= 2 && !selectedVariantId,
  });

  const { data: waStatus, isLoading: isLoadingWa, refetch: refetchWa } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => notificationsApi.getWhatsAppStatus(),
    enabled: open && !!integration && integration.provider === 'WHATSAPP_TWILIO' && activeTab === 'qr',
    refetchInterval: (query) => (!query.state.data?.isReady && activeTab === 'qr') ? 3000 : false,
  });

  const saveMutation = useMutation({
    mutationFn: () => integrationsApi.saveConfig(integration!.id, configValues),
    onSuccess: () => {
      toast.success('Credenciales guardadas');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al guardar'),
  });

  const testMutation = useMutation({
    mutationFn: () => integrationsApi.testConnection(integration!.id),
    onSuccess: (data) => {
      if (data.success) toast.success('Conexión verificada correctamente');
      else toast.error(data.message || 'Fallo en la prueba de conexión');
    },
    onError: (err: any) => toast.error(err.message || 'Error al probar'),
  });

  const syncMutation = useMutation({
    mutationFn: () => integrationsApi.triggerSync(integration!.id),
    onSuccess: () => {
      toast.success('Sincronización iniciada en segundo plano');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al sincronizar'),
  });

  const retryMutation = useMutation({
    mutationFn: (logId: string) => integrationsApi.retryWebhook(integration!.id, logId),
    onSuccess: () => {
      toast.success('Webhook reenviado');
      queryClient.invalidateQueries({ queryKey: queryKeys.integrations.webhookLogs(integration!.id) });
    },
    onError: (err: any) => toast.error(err.message || 'Error al reintentar'),
  });

  const retryAfipMutation = useMutation({
    mutationFn: (jobId: string) => integrationsApi.retryAfipJob(jobId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Factura re-encolada');
        queryClient.invalidateQueries({ queryKey: queryKeys.integrations.failedAfipJobs() });
      } else {
        toast.error(data.message || 'Error al reintentar');
      }
    },
    onError: (err: any) => toast.error(err.message || 'Error al reintentar'),
  });

  const saveMappingMutation = useMutation({
    mutationFn: (data: { variantId: string; wcProductId: number; wcVariationId: number }) =>
      integrationsApi.saveWcMapping(data.variantId, data.wcProductId, data.wcVariationId),
    onSuccess: () => {
      toast.success('Mapeo guardado con éxito');
      setSelectedVariantId('');
      setWcProductId('');
      setWcVariationId('');
      setVariantSearch('');
      queryClient.invalidateQueries({ queryKey: ['integrations', 'woocommerce', 'mappings'] });
    },
    onError: (err: any) => toast.error(err.message || 'Error al guardar mapeo'),
  });

  const deleteMappingMutation = useMutation({
    mutationFn: (variantId: string) => integrationsApi.deleteWcMapping(variantId),
    onSuccess: () => {
      toast.success('Mapeo eliminado');
      queryClient.invalidateQueries({ queryKey: ['integrations', 'woocommerce', 'mappings'] });
    },
    onError: (err: any) => toast.error(err.message || 'Error al eliminar mapeo'),
  });

  if (!integration) return <Drawer open={open} onClose={onClose} title="..." width="lg"><div /></Drawer>;

  const tabStyle = (tab: string) => ({
    padding: '8px 20px', borderRadius: '6px', border: 'none',
    background: activeTab === tab ? 'var(--accent)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    fontWeight: 700, cursor: 'pointer', fontSize: '14px',
  });

  const getStatusIcon = (s: string) => {
    if (s === 'ACTIVE')         return <Wifi size={14} color="var(--green)" />;
    if (s === 'ERROR')          return <AlertTriangle size={14} color="var(--red)" />;
    if (s === 'INACTIVE')       return <WifiOff size={14} color="var(--text-muted)" />;
    if (s === 'PENDING_CONFIG') return <Clock size={14} color="var(--orange)" />;
    return null;
  };

  return (
    <Drawer open={open} onClose={onClose} title={integration.name} width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

        {/* Header Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              {getStatusIcon(integration.status)}
              <span style={{ fontWeight: 800, fontSize: '16px' }}>{integration.provider}</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{integration.description}</p>
            {integration.lastSyncAt && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Última sincronización: {new Date(integration.lastSyncAt).toLocaleString()}</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ActionGuard action="manage" subject="Settings">
              <Button variant="ghost" size="sm" onClick={() => testMutation.mutate()} loading={testMutation.isPending} icon={<TestTube size={14} />}>Probar</Button>
              <Button variant="ghost" size="sm" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending} icon={<RefreshCw size={14} />}>Sincronizar</Button>
            </ActionGuard>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', width: 'fit-content' }}>
          <button style={tabStyle('config')} onClick={() => setActiveTab('config')}>Credenciales</button>
          {integration.provider === 'AFIP' ? (
            <button style={tabStyle('failed-afip')} onClick={() => setActiveTab('failed-afip')}>Facturas Fallidas</button>
          ) : (
            <button style={tabStyle('webhooks')} onClick={() => setActiveTab('webhooks')}>Webhook Logs</button>
          )}
          {integration.provider === 'WOOCOMMERCE' && (
            <button style={tabStyle('mappings')} onClick={() => setActiveTab('mappings')}>Mapeo de Variantes</button>
          )}
          {integration.provider === 'WHATSAPP_TWILIO' && (
            <button style={tabStyle('qr')} onClick={() => setActiveTab('qr')}>Vincular Dispositivo (QR)</button>
          )}
        </div>

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {integration.webhookUrl && (
              <div style={{ padding: '12px 16px', background: 'var(--blue-bg)', border: '1px solid var(--blue)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: 'var(--blue)' }}>URL del Webhook Entrante (configurá en el proveedor)</p>
                <code style={{ fontSize: '13px', wordBreak: 'break-all' }}>{integration.webhookUrl}</code>
              </div>
            )}

            {fields.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No hay campos de configuración para este proveedor.</p>
            ) : (
              fields.map(field => {
                const isSecret = field.secret ?? false;
                const isVisible = showSecrets[field.key] ?? false;
                const currentVal = configValues[field.key] ?? integration.config?.[field.key] ?? '';
                return (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>{field.label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={isSecret && !isVisible ? 'password' : 'text'}
                        value={currentVal}
                        placeholder={currentVal ? '••••••••••• (guardado)' : field.placeholder}
                        onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        style={{ width: '100%', padding: isSecret ? '10px 44px 10px 12px' : '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}
                      />
                      {isSecret && (
                        <button type="button" onClick={() => setShowSecrets(p => ({ ...p, [field.key]: !p[field.key] }))} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
                          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {fields.length > 0 && (
              <ActionGuard action="manage" subject="Settings">
                <Button variant="primary" onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} icon={<Save size={16} />}>
                  Guardar Credenciales
                </Button>
              </ActionGuard>
            )}
          </div>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoadingLogs ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Cargando logs...</p>
            ) : !webhookData || webhookData.data.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay registros de webhooks.</p>
            ) : (
              <Table
                keyField="id"
                data={webhookData.data}
                columns={[
                  {
                    key: 'date', header: 'Fecha',
                    render: (l: WebhookLog) => <span style={{ fontSize: '12px' }}>{new Date(l.createdAt).toLocaleString()}</span>
                  },
                  {
                    key: 'dir', header: 'Dirección',
                    render: (l: WebhookLog) => <Badge color={l.direction === 'INBOUND' ? 'blue' : 'gray'}>{l.direction}</Badge>
                  },
                  {
                    key: 'event', header: 'Evento',
                    render: (l: WebhookLog) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{l.event}</span>
                  },
                  {
                    key: 'status', header: 'HTTP',
                    render: (l: WebhookLog) => l.statusCode
                      ? <Badge color={l.success ? 'green' : 'red'}>{l.statusCode}</Badge>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                  },
                  {
                    key: 'time', header: 'Resp.',
                    render: (l: WebhookLog) => l.responseTime
                      ? <span style={{ fontSize: '12px' }}>{l.responseTime}ms</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                  },
                  {
                    key: 'result', header: 'Resultado',
                    render: (l: WebhookLog) => l.success
                      ? <Badge color="green"><CheckCircle size={12} /> OK</Badge>
                      : <Badge color="red"><XCircle size={12} /> Fallido</Badge>
                  },
                  {
                    key: 'actions', header: '',
                    render: (l: WebhookLog) => !l.success ? (
                      <ActionGuard action="manage" subject="Settings">
                        <Button variant="ghost" size="sm" onClick={() => retryMutation.mutate(l.id)} icon={<RotateCcw size={14} />}>Retry</Button>
                      </ActionGuard>
                    ) : null
                  }
                ]}
              />
            )}
          </div>
        )}

        {/* Failed AFIP Jobs Tab */}
        {activeTab === 'failed-afip' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {isLoadingFailedAfip ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Cargando facturas fallidas...</p>
            ) : !failedAfipJobs || failedAfipJobs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay facturas fallidas pendientes.</p>
            ) : (
              <Table
                keyField="id"
                data={failedAfipJobs}
                columns={[
                  {
                    key: 'date', header: 'Fecha Fallo',
                    render: (j: any) => <span style={{ fontSize: '12px' }}>{new Date(j.failedAt).toLocaleString()}</span>
                  },
                  {
                    key: 'orderId', header: 'ID Pedido',
                    render: (j: any) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{j.data?.orderId || '—'}</span>
                  },
                  {
                    key: 'reason', header: 'Razón del Fallo',
                    render: (j: any) => <span style={{ color: 'var(--red)', fontSize: '13px', fontWeight: 500 }}>{j.failedReason}</span>
                  },
                  {
                    key: 'attempts', header: 'Intentos',
                    render: (j: any) => <Badge color="orange">{j.attemptsMade} / 5</Badge>
                  },
                  {
                    key: 'actions', header: '',
                    render: (j: any) => (
                      <ActionGuard action="manage" subject="Settings">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => retryAfipMutation.mutate(j.id)}
                          loading={retryAfipMutation.isPending && retryAfipMutation.variables === j.id}
                          icon={<RotateCcw size={14} />}
                        >
                          Reintentar
                        </Button>
                      </ActionGuard>
                    )
                  }
                ]}
              />
            )}
          </div>
        )}

        {/* Mappings Tab */}
        {activeTab === 'mappings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
            
            {/* Create Mapping Form */}
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>Crear Nuevo Mapeo</h4>
              
              <div className="grid-responsive grid-cols-3" style={{ gap: "12px" }}>
                
                {/* Variant Search Autocomplete */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>Variante ERP (Buscar por SKU/Nombre)</label>
                  <input
                    type="text"
                    value={variantSearch}
                    placeholder="Escribe 2+ caracteres..."
                    onChange={e => {
                      setVariantSearch(e.target.value);
                      if (selectedVariantId) setSelectedVariantId('');
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-base)' }}
                  />
                  {variantSearch.length >= 2 && !selectedVariantId && searchedVariants && searchedVariants.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      {searchedVariants.map((v: any) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            setVariantSearch(`${v.product?.name} (${v.sku})`);
                          }}
                          style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-base)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <strong>{v.product?.name}</strong> - SKU: {v.sku} {v.size ? `| Talle: ${v.size}` : ''} {v.color ? `| Color: ${v.color}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>WooCommerce Product ID</label>
                  <input
                    type="number"
                    value={wcProductId}
                    placeholder="Ej. 101"
                    onChange={e => setWcProductId(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-base)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600 }}>WooCommerce Variation ID</label>
                  <input
                    type="number"
                    value={wcVariationId}
                    placeholder="Ej. 202 (0 si es producto simple)"
                    onChange={e => setWcVariationId(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-base)' }}
                  />
                </div>

              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={!selectedVariantId || !wcProductId}
                loading={saveMappingMutation.isPending}
                onClick={() => {
                  saveMappingMutation.mutate({
                    variantId: selectedVariantId,
                    wcProductId: parseInt(wcProductId, 10),
                    wcVariationId: parseInt(wcVariationId || '0', 10),
                  });
                }}
                style={{ width: 'fit-content', alignSelf: 'flex-end' }}
              >
                Guardar Mapeo
              </Button>
            </div>

            {/* Mappings Table */}
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800 }}>Mapeos Existentes</h4>
              {isLoadingMappings ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Cargando mapeos...</p>
              ) : !mappingsData || mappingsData.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No hay variantes mapeadas con WooCommerce aún.</p>
              ) : (
                <Table
                  keyField="id"
                  data={mappingsData}
                  columns={[
                    {
                      key: 'product', header: 'Producto ERP',
                      render: (m: any) => (
                        <div style={{ fontSize: '13px' }}>
                          <strong>{m.variant?.product?.name || '—'}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {m.variant?.size ? `Talle: ${m.variant.size} ` : ''}
                            {m.variant?.color ? `| Color: ${m.variant.color}` : ''}
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'sku', header: 'SKU ERP',
                      render: (m: any) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{m.variant?.sku || '—'}</span>
                    },
                    {
                      key: 'wcProduct', header: 'WC Product ID',
                      render: (m: any) => <span style={{ fontSize: '13px' }}>{m.wcProductId}</span>
                    },
                    {
                      key: 'wcVariation', header: 'WC Variation ID',
                      render: (m: any) => <span style={{ fontSize: '13px' }}>{m.wcVariationId || '—'}</span>
                    },
                    {
                      key: 'actions', header: '',
                      render: (m: any) => (
                        <ActionGuard action="manage" subject="Settings">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMappingMutation.mutate(m.variantId)}
                            loading={deleteMappingMutation.isPending && deleteMappingMutation.variables === m.variantId}
                            style={{ color: 'var(--red)' }}
                          >
                            Eliminar
                          </Button>
                        </ActionGuard>
                      )
                    }
                  ]}
                />
              )}
            </div>

          </div>
        )}

        {/* WhatsApp QR Tab */}
        {activeTab === 'qr' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border)', padding: '40px' }}>
            {isLoadingWa ? (
              <p style={{ color: 'var(--text-muted)' }}>Cargando estado de sesión...</p>
            ) : waStatus?.isReady ? (
              <>
                <div style={{ width: 80, height: 80, borderRadius: 40, background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <CheckCircle size={40} color="#25D366" />
                </div>
                <h3 style={{ margin: 0, fontSize: 20 }}>Dispositivo Vinculado</h3>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10 }}>Tu sesión de WhatsApp está activa y lista para enviar mensajes.</p>
                <Button variant="outline" style={{ marginTop: 20 }} onClick={() => refetchWa()}>Verificar de nuevo</Button>
              </>
            ) : waStatus?.qrCode ? (
              <>
                <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>Escanea este código QR</h3>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>Abre WhatsApp en tu teléfono, ve a Dispositivos vinculados y escanea el código.</p>
                <div style={{ padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img src={waStatus.qrCode} alt="WhatsApp QR Code" style={{ width: 256, height: 256 }} />
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={12} className="spin" />
                  Actualizando automáticamente...
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Iniciando sesión de WhatsApp. Por favor, espera...</p>
            )}
          </div>
        )}

      </div>
    </Drawer>
  );
}
