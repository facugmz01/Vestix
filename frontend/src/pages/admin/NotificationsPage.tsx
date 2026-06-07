import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Bell, CheckCircle, XCircle, AlertTriangle, Clock, Mail, MessageSquare } from 'lucide-react';

import {
  PageContainer, Section, Table, Button, Badge,
  SearchInput, FiltersBar, Pagination, EmptyState,
  ApiErrorDisplay, TableSkeleton
} from '@/components/ui';
import { notificationsApi } from '@/api/notifications.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import type { NotificationTemplate } from '@/types';

import { TemplateFormDrawer } from '@/features/notifications/components/TemplateFormDrawer';

// ─── Sub-components ─────────────────────────────────────────────────────────

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

const EVENT_LABELS: Record<string, string> = {
  SALE_CONFIRMED:          'Venta Confirmada',
  PURCHASE_ORDER_ISSUED:   'OC Emitida',
  GOODS_RECEIPT_RECEIVED:  'Recepción Mercadería',
  LOW_STOCK_ALERT:         'Alerta Stock Bajo',
  TRANSFER_DISPATCHED:     'Transfer. Despachada',
  TRANSFER_RECEIVED:       'Transfer. Recibida',
  INVOICE_ISSUED:          'Factura Emitida',
  PAYMENT_RECEIVED:        'Pago Recibido',
  RETURN_APPROVED:         'Dev. Aprobada',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'logs'>('templates');

  // Templates
  const [templatePage, setTemplatePage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Logs
  const [logPage, setLogPage] = useState(1);
  const [logSearch, setLogSearch] = useState('');
  const [logStatus, setLogStatus] = useState('');
  const [logChannel, setLogChannel] = useState('');
  const [logEvent, setLogEvent] = useState('');

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

  const templates = templatesData?.data ?? [];
  const logs = logsData?.data ?? [];

  const handleEdit = (t: NotificationTemplate) => { setEditingTemplate(t); setFormOpen(true); };
  const handleNew = () => { setEditingTemplate(null); setFormOpen(true); };

  const tabStyle = (tab: string) => ({
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: activeTab === tab ? 'var(--accent)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '14px',
  });

  return (
    <PageContainer
      title="Notificaciones"
      subtitle="Plantillas de mensajes automáticos y registro de entregas (Email, SMS, WhatsApp)."
      action={
        activeTab === 'templates' && (
          <ActionGuard action="manage" subject="Settings">
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleNew}>
              Nueva Plantilla
            </Button>
          </ActionGuard>
        )
      }
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)', width: 'fit-content' }}>
        <button style={tabStyle('templates')} onClick={() => setActiveTab('templates')}>Plantillas de Mensajes</button>
        <button style={tabStyle('logs')} onClick={() => setActiveTab('logs')}>Log de Entregas</button>
      </div>

      {/* ── TEMPLATES TAB ── */}
      {activeTab === 'templates' && (
        <Section>
          {isLoadingTemplates ? (
            <TableSkeleton rows={5} />
          ) : templatesError ? (
            <ApiErrorDisplay error={templatesError} onRetry={refetchTemplates} />
          ) : templates.length === 0 ? (
            <EmptyState
              icon={<Bell size={40} />}
              title="Sin Plantillas"
              message="Crea la primera plantilla de notificación para comenzar a enviar mensajes automáticos."
            />
          ) : (
            <Table
              keyField="id"
              data={templates}
              columns={[
                {
                  key: 'name', header: 'Nombre',
                  render: t => <span style={{ fontWeight: 700 }}>{t.name}</span>
                },
                {
                  key: 'event', header: 'Evento Disparador',
                  render: t => <Badge color="blue">{EVENT_LABELS[t.event] || t.event}</Badge>
                },
                {
                  key: 'channel', header: 'Canal',
                  render: t => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, fontSize: '13px' }}>
                      <ChannelIcon channel={t.channel} /> {t.channel}
                    </div>
                  )
                },
                {
                  key: 'subject', header: 'Asunto (Email)',
                  render: t => <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t.subject || '—'}</span>
                },
                {
                  key: 'active', header: 'Estado',
                  render: t => t.isActive
                    ? <Badge color="green">Activa</Badge>
                    : <Badge color="gray">Inactiva</Badge>
                },
                {
                  key: 'actions', header: '',
                  render: t => (
                    <ActionGuard action="manage" subject="Settings">
                      <Button variant="ghost" size="sm" icon={<Edit size={16} />} onClick={() => handleEdit(t)}>Editar</Button>
                    </ActionGuard>
                  )
                }
              ]}
            />
          )}
          <Pagination page={templatePage} pageSize={10} total={templatesData?.total ?? 0} onPageChange={setTemplatePage} />
        </Section>
      )}

      {/* ── LOGS TAB ── */}
      {activeTab === 'logs' && (
        <>
          <FiltersBar actions={<Badge color="gray">{logsData?.total ?? 0} entregas</Badge>}>
            <SearchInput placeholder="Buscar destinatario o referencia..." onSearch={v => { setLogSearch(v); setLogPage(1); }} />

            <select value={logStatus} onChange={e => { setLogStatus(e.target.value); setLogPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">Todos los estados</option>
              <option value="DELIVERED">Entregado</option>
              <option value="SENT">Enviado</option>
              <option value="PENDING">Pendiente</option>
              <option value="FAILED">Fallido</option>
              <option value="BOUNCED">Rebotado</option>
            </select>

            <select value={logChannel} onChange={e => { setLogChannel(e.target.value); setLogPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">Todos los canales</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="PUSH">Push</option>
            </select>

            <select value={logEvent} onChange={e => { setLogEvent(e.target.value); setLogPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">Todos los eventos</option>
              {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </FiltersBar>

          <Section>
            {isLoadingLogs ? (
              <TableSkeleton rows={8} />
            ) : logsError ? (
              <ApiErrorDisplay error={logsError} onRetry={refetchLogs} />
            ) : logs.length === 0 ? (
              <EmptyState
                icon={<Bell size={40} />}
                title="Sin Registros"
                message="No hay logs de notificaciones con los filtros activos."
              />
            ) : (
              <Table
                keyField="id"
                data={logs}
                columns={[
                  {
                    key: 'id', header: 'ID',
                    render: l => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{l.id.split('-')[0]}</span>
                  },
                  {
                    key: 'date', header: 'Fecha',
                    render: l => <span style={{ fontSize: '13px' }}>{new Date(l.createdAt).toLocaleString()}</span>
                  },
                  {
                    key: 'channel', header: 'Canal',
                    render: l => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                        <ChannelIcon channel={l.channel} /> {l.channel}
                      </div>
                    )
                  },
                  {
                    key: 'event', header: 'Evento',
                    render: l => <Badge color="blue">{EVENT_LABELS[l.event] || l.event}</Badge>
                  },
                  {
                    key: 'recipient', header: 'Destinatario',
                    render: l => <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{l.recipient}</span>
                  },
                  {
                    key: 'reference', header: 'Ref.',
                    render: l => l.referenceId
                      ? <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '12px' }}>{l.referenceId.split('-')[0]}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                  },
                  {
                    key: 'status', header: 'Estado de Entrega',
                    render: l => (
                      <div>
                        <DeliveryStatusBadge status={l.status} />
                        {l.status === 'FAILED' && l.errorMessage && (
                          <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--red)' }}>{l.errorMessage}</p>
                        )}
                      </div>
                    )
                  },
                ]}
              />
            )}
            <Pagination page={logPage} pageSize={15} total={logsData?.total ?? 0} onPageChange={setLogPage} />
          </Section>
        </>
      )}

      <TemplateFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        template={editingTemplate}
      />

    </PageContainer>
  );
}
