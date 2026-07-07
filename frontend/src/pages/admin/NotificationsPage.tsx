import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Bell, CheckCircle, XCircle, AlertTriangle, Clock, Mail, MessageSquare, Send, RefreshCw, ListOrdered } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import {
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton
} from '@/components/ui';
import { notificationsApi } from '@/api/notifications.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import type { NotificationTemplate } from '@/types';

import { TemplateFormDrawer } from '@/features/notifications/components/TemplateFormDrawer';
import { TestNotificationDrawer } from '@/features/notifications/components/TestNotificationDrawer';
import { NOTIFICATION_EVENT_LABELS } from '@/features/notifications/constants';
import styles from '@/features/notifications/components/Notifications.module.css';

function DeliveryStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'DELIVERED': return <Badge color="green"><CheckCircle size={12} /> Entregado</Badge>;
    case 'SENT':      return <Badge color="blue"><CheckCircle size={12} /> Enviado</Badge>;
    case 'PENDING':   return <Badge color="warning"><Clock size={12} /> Pendiente</Badge>;
    case 'FAILED':    return <Badge color="red"><AlertTriangle size={12} /> Fallido</Badge>;
    case 'BOUNCED':   return <Badge color="red"><XCircle size={12} /> Rebotado</Badge>;
    default:          return <Badge color="gray">{status}</Badge>;
  }
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'EMAIL')    return <Mail size={14} />;
  if (channel === 'WHATSAPP') return <MessageSquare size={14} style={{ color: '#25D366' }} />;
  if (channel === 'SMS')      return <MessageSquare size={14} />;
  return <Bell size={14} />;
}

function StatsBar() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.notifications.stats(),
    queryFn: () => notificationsApi.getStats(),
    refetchInterval: 30_000,
  });

  if (isLoading || !stats) return null;

  const cards = [
    { label: 'Últimas 24h', value: stats.totals.last24h, color: 'var(--blue)' },
    { label: 'Enviados', value: stats.totals.sent, color: 'var(--green)' },
    { label: 'Fallidos', value: stats.totals.failed, color: 'var(--red)' },
    { label: 'Pendientes', value: stats.totals.pending, color: 'var(--orange)' },
    { label: 'En cola', value: stats.queuePending, color: 'var(--text-primary)' },
    { label: 'Plantillas activas', value: `${stats.templates.active}/${stats.templates.total}`, color: 'var(--text-primary)' },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map(c => (
        <div key={c.label} className={styles.statCard}>
          <p className={styles.statValue} style={{ color: c.color }}>{c.value}</p>
          <p className={styles.statLabel}>{c.label}</p>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'logs' | 'queue'>('templates');

  const [templatePage, setTemplatePage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [logStatus, setLogStatus] = useState('');
  const [logChannel, setLogChannel] = useState('');
  const [logEvent, setLogEvent] = useState('');

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      notificationsApi.toggleTemplate(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.templates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.stats() });
    },
    onError: () => toast.error('No se pudo cambiar el estado de la plantilla'),
  });

  const retryMutation = useMutation({
    mutationFn: (logId: string) => notificationsApi.retryLog(logId),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.logs() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.queue() });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al reintentar'),
  });

  const { data: templatesData, isLoading: isLoadingTemplates, error: templatesError, refetch: refetchTemplates } = useQuery({
    queryKey: queryKeys.notifications.templates({ page: templatePage }),
    queryFn: () => notificationsApi.getTemplates({ page: templatePage, pageSize: 10 }),
    enabled: activeTab === 'templates',
  });

  const { data: logsData, isLoading: isLoadingLogs, error: logsError, refetch: refetchLogs } = useQuery({
    queryKey: queryKeys.notifications.logs({ page: logPage, search: logSearch, status: logStatus, channel: logChannel, event: logEvent }),
    queryFn: () => notificationsApi.getLogs({ page: logPage, pageSize: 15, search: logSearch, status: logStatus, channel: logChannel, event: logEvent }),
    enabled: activeTab === 'logs',
  });

  const { data: queueData, isLoading: isLoadingQueue, error: queueError, refetch: refetchQueue } = useQuery({
    queryKey: queryKeys.notifications.queue(),
    queryFn: () => notificationsApi.getQueue(),
    enabled: activeTab === 'queue',
    refetchInterval: activeTab === 'queue' ? 10_000 : false,
  });

  const templates = templatesData?.data ?? [];
  const logs = logsData?.data ?? [];
  const queueJobs = queueData?.data ?? [];

  const handleEdit = (t: NotificationTemplate) => { setEditingTemplate(t); setFormOpen(true); };
  const handleNew = () => { setEditingTemplate(null); setFormOpen(true); };

  return (
    <PageContainer
      title="Notificaciones"
      subtitle="Plantillas, monitoreo de entregas y cola de envío (Email, SMS, WhatsApp)."
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionGuard action="manage" subject="Settings">
            <Button variant="outline" icon={<Send size={16} />} onClick={() => setTestOpen(true)}>
              Prueba de envío
            </Button>
          </ActionGuard>
          {activeTab === 'templates' && (
            <ActionGuard action="manage" subject="Settings">
              <Button variant="primary" icon={<Plus size={16} />} onClick={handleNew}>
                Nueva Plantilla
              </Button>
            </ActionGuard>
          )}
        </div>
      }
    >
      <StatsBar />

      <div className={styles.tabsContainer}>
        <button className={clsx(styles.tab, activeTab === 'templates' && styles.tabActive)} onClick={() => setActiveTab('templates')}>
          Plantillas
        </button>
        <button className={clsx(styles.tab, activeTab === 'logs' && styles.tabActive)} onClick={() => setActiveTab('logs')}>
          Log de Entregas
        </button>
        <button className={clsx(styles.tab, activeTab === 'queue' && styles.tabActive)} onClick={() => setActiveTab('queue')}>
          Cola BullMQ
        </button>
      </div>

      {activeTab === 'templates' && (
        <Section>
          {isLoadingTemplates ? <TableSkeleton rows={5} /> : templatesError ? (
            <ApiErrorDisplay error={templatesError} onRetry={refetchTemplates} />
          ) : templates.length === 0 ? (
            <EmptyState icon={<Bell size={40} />} title="Sin Plantillas" message="Crea la primera plantilla de notificación." />
          ) : (
            <Table
              keyField="id"
              data={templates}
              columns={[
                { key: 'name', header: 'Nombre', render: t => <span style={{ fontWeight: 700 }}>{t.name}</span> },
                { key: 'event', header: 'Evento', render: t => <Badge color="blue">{NOTIFICATION_EVENT_LABELS[t.event] || t.event}</Badge> },
                { key: 'channel', header: 'Canal', render: t => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                    <ChannelIcon channel={t.channel} /> {t.channel}
                  </div>
                )},
                { key: 'subject', header: 'Asunto', render: t => <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t.subject || '—'}</span> },
                {
                  key: 'active', header: 'Estado',
                  render: t => (
                    <ActionGuard action="manage" subject="Settings">
                      <button
                        type="button"
                        className={clsx(styles.toggleBtn, t.isActive ? styles.toggleBtnActive : styles.toggleBtnInactive)}
                        onClick={() => toggleMutation.mutate({ id: t.id, isActive: !t.isActive })}
                        disabled={toggleMutation.isPending}
                      >
                        {t.isActive ? 'Activa' : 'Inactiva'}
                      </button>
                    </ActionGuard>
                  ),
                },
                {
                  key: 'actions', header: '',
                  render: t => (
                    <ActionGuard action="manage" subject="Settings">
                      <Button variant="ghost" size="sm" icon={<Edit size={16} />} onClick={() => handleEdit(t)}>Editar</Button>
                    </ActionGuard>
                  ),
                },
              ]}
            />
          )}
          <Pagination page={templatePage} pageSize={10} total={templatesData?.total ?? 0} onPageChange={setTemplatePage} />
        </Section>
      )}

      {activeTab === 'logs' && (
        <>
          <FiltersBar actions={<Badge color="gray">{logsData?.total ?? 0} entregas</Badge>}>
            <SearchInput placeholder="Buscar destinatario..." onSearch={v => { setLogSearch(v); setLogPage(1); }} />
            <select value={logStatus} onChange={e => { setLogStatus(e.target.value); setLogPage(1); }} className={styles.filterSelect}>
              <option value="">Todos los estados</option>
              <option value="SENT">Enviado</option>
              <option value="PENDING">Pendiente</option>
              <option value="FAILED">Fallido</option>
            </select>
            <select value={logChannel} onChange={e => { setLogChannel(e.target.value); setLogPage(1); }} className={styles.filterSelect}>
              <option value="">Todos los canales</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
            <select value={logEvent} onChange={e => { setLogEvent(e.target.value); setLogPage(1); }} className={styles.filterSelect}>
              <option value="">Todos los eventos</option>
              {Object.entries(NOTIFICATION_EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FiltersBar>

          <Section>
            {isLoadingLogs ? <TableSkeleton rows={8} /> : logsError ? (
              <ApiErrorDisplay error={logsError} onRetry={refetchLogs} />
            ) : logs.length === 0 ? (
              <EmptyState icon={<Bell size={40} />} title="Sin Registros" message="No hay logs con los filtros activos." />
            ) : (
              <Table
                keyField="id"
                data={logs}
                columns={[
                  { key: 'date', header: 'Fecha', render: l => <span style={{ fontSize: '13px' }}>{new Date(l.createdAt).toLocaleString()}</span> },
                  { key: 'channel', header: 'Canal', render: l => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                      <ChannelIcon channel={l.channel} /> {l.channel}
                    </div>
                  )},
                  { key: 'event', header: 'Evento', render: l => <Badge color="blue">{NOTIFICATION_EVENT_LABELS[l.event] || l.event}</Badge> },
                  { key: 'recipient', header: 'Destinatario', render: l => <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{l.recipient}</span> },
                  {
                    key: 'status', header: 'Estado',
                    render: l => (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <DeliveryStatusBadge status={l.status} />
                        {l.status === 'FAILED' && l.errorMessage && (
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--red)' }}>{l.errorMessage}</p>
                        )}
                        {l.status === 'FAILED' && (
                          <ActionGuard action="manage" subject="Settings">
                            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} loading={retryMutation.isPending}
                              onClick={() => retryMutation.mutate(l.id)}>
                              Reintentar
                            </Button>
                          </ActionGuard>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            )}
            <Pagination page={logPage} pageSize={15} total={logsData?.total ?? 0} onPageChange={setLogPage} />
          </Section>
        </>
      )}

      {activeTab === 'queue' && (
        <Section>
          {isLoadingQueue ? <TableSkeleton rows={6} /> : queueError ? (
            <ApiErrorDisplay error={queueError} onRetry={refetchQueue} />
          ) : queueJobs.length === 0 ? (
            <EmptyState icon={<ListOrdered size={40} />} title="Cola vacía" message="No hay trabajos pendientes en BullMQ." />
          ) : (
            <Table
              keyField="id"
              data={queueJobs}
              columns={[
                { key: 'id', header: 'Job ID', render: j => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{j.id}</span> },
                { key: 'template', header: 'Plantilla', render: j => <Badge color="blue">{NOTIFICATION_EVENT_LABELS[j.templateKey] || j.templateKey}</Badge> },
                { key: 'channel', header: 'Canal', render: j => j.channel },
                { key: 'recipient', header: 'Destinatario', render: j => <span style={{ fontFamily: 'monospace' }}>{j.recipient}</span> },
                { key: 'status', header: 'Estado', render: j => <Badge color={j.status === 'FAILED' ? 'red' : 'gray'}>{j.status}</Badge> },
                { key: 'attempts', header: 'Intentos', render: j => j.attempts },
                { key: 'error', header: 'Error', render: j => j.lastError ? <span style={{ fontSize: '11px', color: 'var(--red)' }}>{j.lastError}</span> : '—' },
              ]}
            />
          )}
        </Section>
      )}

      <TemplateFormDrawer open={formOpen} onClose={() => setFormOpen(false)} template={editingTemplate} />
      <TestNotificationDrawer open={testOpen} onClose={() => setTestOpen(false)} />
    </PageContainer>
  );
}
