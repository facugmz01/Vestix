import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
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
import drawerStyles from '@/styles/DetailDrawerShared.module.css';
import styles from './IntegrationDetailDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  integration: Integration | null;
}

// Config field definitions per provider
const PROVIDER_FIELDS: Record<string, { key: string; label: string; placeholder: string; secret?: boolean; type?: 'select'; options?: { value: string; label: string }[] }[]> = {
  MERCADOPAGO: [
    {
      key: 'environment',
      label: 'Ambiente',
      placeholder: '',
      type: 'select',
      options: [
        { value: '', label: 'Detectar automático (solo TEST-)' },
        { value: 'test', label: 'Pruebas (sandbox)' },
        { value: 'production', label: 'Producción' },
      ],
    },
    { key: 'publicKey', label: 'Public Key', placeholder: 'APP_USR-...', secret: false },
    { key: 'accessToken', label: 'Access Token', placeholder: 'TEST-... o APP_USR-...', secret: true },
    { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'Clave de Tus integraciones', secret: true },
    { key: 'externalPosId', label: 'External POS ID (QR híbrido)', placeholder: 'CAJA001', secret: false },
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
    enabled: open && !!integration && integration.provider === 'WHATSAPP' && activeTab === 'qr',
    refetchInterval: (query) => {
      if (!query.state.data?.isReady && activeTab === 'qr') return 4000;
      return false;
    },
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

  const getStatusIcon = (s: string) => {
    if (s === 'ACTIVE')         return <Wifi size={14} color="var(--green)" />;
    if (s === 'ERROR')          return <AlertTriangle size={14} color="var(--red)" />;
    if (s === 'INACTIVE')       return <WifiOff size={14} color="var(--text-muted)" />;
    if (s === 'PENDING_CONFIG') return <Clock size={14} color="var(--orange)" />;
    return null;
  };

  return (
    <Drawer open={open} onClose={onClose} title={integration.name} width="lg">
      <div className={styles.stack}>

        {/* Header Status */}
        <div className={styles.headerCard}>
          <div>
            <div className={styles.headerTitleRow}>
              {getStatusIcon(integration.status)}
              <span className={styles.headerProvider}>{integration.provider}</span>
            </div>
            <p className={styles.headerDesc}>{integration.description}</p>
            {integration.lastSyncAt && (
              <p className={styles.headerSync}>Última sincronización: {new Date(integration.lastSyncAt).toLocaleString()}</p>
            )}
          </div>
          <div className={styles.headerActions}>
            <ActionGuard action="manage" subject="Settings">
              <Button variant="ghost" size="sm" onClick={() => testMutation.mutate()} loading={testMutation.isPending} icon={<TestTube size={14} />}>Probar</Button>
              <Button variant="ghost" size="sm" onClick={() => syncMutation.mutate()} loading={syncMutation.isPending} icon={<RefreshCw size={14} />}>Sincronizar</Button>
            </ActionGuard>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabBar}>
          <button type="button" className={clsx(styles.tab, activeTab === 'config' && styles.tabActive)} onClick={() => setActiveTab('config')}>Credenciales</button>
          {integration.provider === 'AFIP' ? (
            <button type="button" className={clsx(styles.tab, activeTab === 'failed-afip' && styles.tabActive)} onClick={() => setActiveTab('failed-afip')}>Facturas Fallidas</button>
          ) : (
            <button type="button" className={clsx(styles.tab, activeTab === 'webhooks' && styles.tabActive)} onClick={() => setActiveTab('webhooks')}>Webhook Logs</button>
          )}
          {integration.provider === 'WOOCOMMERCE' && (
            <button type="button" className={clsx(styles.tab, activeTab === 'mappings' && styles.tabActive)} onClick={() => setActiveTab('mappings')}>Mapeo de Variantes</button>
          )}
          {integration.provider === 'WHATSAPP' && (
            <button type="button" className={clsx(styles.tab, activeTab === 'qr' && styles.tabActive)} onClick={() => setActiveTab('qr')}>Vincular Dispositivo (QR)</button>
          )}
        </div>

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className={styles.configStack}>
            {integration.webhookUrls?.length ? (
              <div className={styles.webhookStack}>
                {integration.webhookUrls.map(endpoint => (
                  <div key={endpoint.url} className={styles.webhookBox}>
                    <p className={styles.webhookLabel}>
                      Webhook — {endpoint.label}
                    </p>
                    <code className={styles.webhookCode}>{endpoint.url}</code>
                  </div>
                ))}
                <p className={styles.webhookHint}>
                  Configurá estos URLs en Tus integraciones de Mercado Pago. Para QR POS, suscribite al tópico <strong>Order (Mercado Pago)</strong>; para Checkout Pro, al tópico <strong>Payments</strong>.
                </p>
              </div>
            ) : integration.webhookUrl ? (
              <div className={styles.webhookBox}>
                <p className={styles.webhookLabel}>URL del Webhook Entrante (configurá en el proveedor)</p>
                <code className={styles.webhookCode}>{integration.webhookUrl}</code>
              </div>
            ) : null}

            {fields.length === 0 ? (
              <p className={drawerStyles.emptyCenter}>No hay campos de configuración para este proveedor.</p>
            ) : (
              fields.map(field => {
                const isSecret = field.secret ?? false;
                const isVisible = showSecrets[field.key] ?? false;
                const currentVal = configValues[field.key] ?? integration.config?.[field.key] ?? '';
                if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.key} className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>{field.label}</label>
                      <select
                        value={currentVal}
                        onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={styles.fieldSelect}
                      >
                        {field.options.map(opt => (
                          <option key={opt.value || '__auto'} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={field.key} className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>{field.label}</label>
                    <div className={styles.fieldInputWrap}>
                      <input
                        type={isSecret && !isVisible ? 'password' : 'text'}
                        value={currentVal}
                        placeholder={currentVal ? '••••••••••• (guardado)' : field.placeholder}
                        onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={clsx(styles.fieldInput, isSecret && styles.fieldInputSecret)}
                      />
                      {isSecret && (
                        <button type="button" onClick={() => setShowSecrets(p => ({ ...p, [field.key]: !p[field.key] }))} className={styles.toggleSecret}>
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
          <div className={styles.scrollPanel}>
            {isLoadingLogs ? (
              <p className={drawerStyles.emptyCenter}>Cargando logs...</p>
            ) : !webhookData || webhookData.data.length === 0 ? (
              <p className={drawerStyles.emptyCenter}>No hay registros de webhooks.</p>
            ) : (
              <Table
                keyField="id"
                data={webhookData.data}
                columns={[
                  {
                    key: 'date', header: 'Fecha',
                    render: (l: WebhookLog) => <span className={styles.cellDate}>{new Date(l.createdAt).toLocaleString()}</span>
                  },
                  {
                    key: 'dir', header: 'Dirección',
                    render: (l: WebhookLog) => <Badge color={l.direction === 'INBOUND' ? 'blue' : 'gray'}>{l.direction}</Badge>
                  },
                  {
                    key: 'event', header: 'Evento',
                    render: (l: WebhookLog) => <span className={styles.cellMono}>{l.event}</span>
                  },
                  {
                    key: 'status', header: 'HTTP',
                    render: (l: WebhookLog) => l.statusCode
                      ? <Badge color={l.success ? 'green' : 'red'}>{l.statusCode}</Badge>
                      : <span className={styles.cellMuted}>—</span>
                  },
                  {
                    key: 'time', header: 'Resp.',
                    render: (l: WebhookLog) => l.responseTime
                      ? <span className={styles.cellDate}>{l.responseTime}ms</span>
                      : <span className={styles.cellMuted}>—</span>
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
          <div className={styles.scrollPanel}>
            {isLoadingFailedAfip ? (
              <p className={drawerStyles.emptyCenter}>Cargando facturas fallidas...</p>
            ) : !failedAfipJobs || failedAfipJobs.length === 0 ? (
              <p className={drawerStyles.emptyCenter}>No hay facturas fallidas pendientes.</p>
            ) : (
              <Table
                keyField="id"
                data={failedAfipJobs}
                columns={[
                  {
                    key: 'date', header: 'Fecha Fallo',
                    render: (j: any) => <span className={styles.cellDate}>{new Date(j.failedAt).toLocaleString()}</span>
                  },
                  {
                    key: 'orderId', header: 'ID Pedido',
                    render: (j: any) => <span className={styles.cellMono}>{j.data?.orderId || '—'}</span>
                  },
                  {
                    key: 'reason', header: 'Razón del Fallo',
                    render: (j: any) => <span className={styles.cellError}>{j.failedReason}</span>
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
          <div className={styles.mappingsStack}>
            
            {/* Create Mapping Form */}
            <div className={styles.mappingForm}>
              <h4 className={styles.mappingTitle}>Crear Nuevo Mapeo</h4>
              
              <div className={clsx('grid-responsive grid-cols-3', styles.mappingGrid)}>
                
                {/* Variant Search Autocomplete */}
                <div className={styles.typeaheadWrap}>
                  <label className={styles.typeaheadLabel}>Variante ERP (Buscar por SKU/Nombre)</label>
                  <input
                    type="text"
                    value={variantSearch}
                    placeholder="Escribe 2+ caracteres..."
                    onChange={e => {
                      setVariantSearch(e.target.value);
                      if (selectedVariantId) setSelectedVariantId('');
                    }}
                    className={styles.typeaheadInput}
                  />
                  {variantSearch.length >= 2 && !selectedVariantId && searchedVariants && searchedVariants.length > 0 && (
                    <div className={styles.typeaheadDropdown}>
                      {searchedVariants.map((v: any) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVariantId(v.id);
                            setVariantSearch(`${v.product?.name} (${v.sku})`);
                          }}
                          className={styles.typeaheadItem}
                        >
                          <strong>{v.product?.name}</strong> - SKU: {v.sku} {v.size ? `| Talle: ${v.size}` : ''} {v.color ? `| Color: ${v.color}` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.typeaheadLabel}>WooCommerce Product ID</label>
                  <input
                    type="number"
                    value={wcProductId}
                    placeholder="Ej. 101"
                    onChange={e => setWcProductId(e.target.value)}
                    className={styles.typeaheadInput}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.typeaheadLabel}>WooCommerce Variation ID</label>
                  <input
                    type="number"
                    value={wcVariationId}
                    placeholder="Ej. 202 (0 si es producto simple)"
                    onChange={e => setWcVariationId(e.target.value)}
                    className={styles.typeaheadInput}
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
                className={styles.saveMappingBtn}
              >
                Guardar Mapeo
              </Button>
            </div>

            {/* Mappings Table */}
            <div>
              <h4 className={styles.mappingsTableTitle}>Mapeos Existentes</h4>
              {isLoadingMappings ? (
                <p className={drawerStyles.emptyCenter}>Cargando mapeos...</p>
              ) : !mappingsData || mappingsData.length === 0 ? (
                <p className={drawerStyles.emptyCenter}>No hay variantes mapeadas con WooCommerce aún.</p>
              ) : (
                <Table
                  keyField="id"
                  data={mappingsData}
                  columns={[
                    {
                      key: 'product', header: 'Producto ERP',
                      render: (m: any) => (
                        <div className={styles.productCell}>
                          <strong>{m.variant?.product?.name || '—'}</strong>
                          <div className={styles.productMeta}>
                            {m.variant?.size ? `Talle: ${m.variant.size} ` : ''}
                            {m.variant?.color ? `| Color: ${m.variant.color}` : ''}
                          </div>
                        </div>
                      )
                    },
                    {
                      key: 'sku', header: 'SKU ERP',
                      render: (m: any) => <span className={styles.cellMono}>{m.variant?.sku || '—'}</span>
                    },
                    {
                      key: 'wcProduct', header: 'WC Product ID',
                      render: (m: any) => <span className={styles.cellText}>{m.wcProductId}</span>
                    },
                    {
                      key: 'wcVariation', header: 'WC Variation ID',
                      render: (m: any) => <span className={styles.cellText}>{m.wcVariationId || '—'}</span>
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
                            className={styles.btnDanger}
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
          <div className={styles.qrPanel}>
            {isLoadingWa ? (
              <p className={styles.qrMuted}>Cargando estado de sesión...</p>
            ) : waStatus?.isReady ? (
              <>
                <div className={styles.qrSuccessIcon}>
                  <CheckCircle size={40} color="#25D366" />
                </div>
                <h3 className={styles.qrTitle}>Dispositivo Vinculado</h3>
                <p className={styles.qrText}>Tu sesión de WhatsApp está activa y lista para enviar mensajes.</p>
                <Button variant="outline" className={styles.qrVerifyBtn} onClick={() => refetchWa()}>Verificar de nuevo</Button>
              </>
            ) : waStatus?.qrCode ? (
              <>
                <h3 className={styles.qrTitleSm}>Escanea este código QR</h3>
                <p className={styles.qrTextMb}>Abre WhatsApp en tu teléfono, ve a Dispositivos vinculados y escanea el código.</p>
                <div className={styles.qrFrame}>
                  <img src={waStatus.qrCode} alt="WhatsApp QR Code" className={styles.qrImage} />
                </div>
                <p className={styles.qrRefresh}>
                  <RefreshCw size={12} />
                  Actualizando automáticamente...
                </p>
              </>
            ) : (
              <>
                <p className={styles.qrMuted}>
                  {waStatus?.state === 'not_configured'
                    ? 'Configurá Evolution API en Ajustes → Notificaciones antes de vincular.'
                    : 'Iniciá el emparejamiento para obtener el código QR.'}
                </p>
                {waStatus?.configured !== false && (
                  <Button
                    variant="primary"
                    onClick={async () => {
                      try {
                        await notificationsApi.connectWhatsApp();
                        refetchWa();
                        toast.success('Solicitud de conexión enviada');
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Error al conectar');
                      }
                    }}
                  >
                    Conectar / Generar QR
                  </Button>
                )}
              </>
            )}
            {waStatus?.webhookUrl && (
              <div className={styles.webhookDelivery}>
                <p className={styles.webhookDeliveryLabel}>Webhook de entrega</p>
                <code className={styles.webhookDeliveryCode}>{waStatus.webhookUrl}</code>
              </div>
            )}
          </div>
        )}

      </div>
    </Drawer>
  );
}
