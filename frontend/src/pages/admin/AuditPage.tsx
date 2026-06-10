import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield, Eye, Plus, Edit2, Trash2, LogIn, LogOut,
  CheckCircle, XCircle, FileText, Ban, Clock, Search
} from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, Tabs
} from '@/components/ui';
import { auditApi } from '@/api/audit.api';
import { queryKeys } from '@/api/queryKeys';
import type { AuditLog } from '@/types';
import { AuditLogDetailDrawer } from '@/features/audit/components/AuditLogDetailDrawer';

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATE:  { label: 'Creación',    color: 'green',  icon: <Plus size={12} /> },
  UPDATE:  { label: 'Edición',     color: 'blue',   icon: <Edit2 size={12} /> },
  DELETE:  { label: 'Eliminación', color: 'red',    icon: <Trash2 size={12} /> },
  LOGIN:   { label: 'Ingreso',     color: 'green',  icon: <LogIn size={12} /> },
  LOGOUT:  { label: 'Cierre',      color: 'gray',   icon: <LogOut size={12} /> },
  ACCESS:  { label: 'Acceso',      color: 'gray',   icon: <Eye size={12} /> },
  APPROVE: { label: 'Aprobación',  color: 'green',  icon: <CheckCircle size={12} /> },
  REJECT:  { label: 'Rechazo',     color: 'red',    icon: <XCircle size={12} /> },
  ISSUE:   { label: 'Emisión',     color: 'blue',   icon: <FileText size={12} /> },
  CANCEL:  { label: 'Cancelación', color: 'orange', icon: <Ban size={12} /> },
};

const MODULES = ['Sales', 'Inventory', 'Finance', 'Purchasing', 'Auth', 'Settings', 'Catalog', 'Returns'];
const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'ISSUE', 'CANCEL'];

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [module, setModule]   = useState('');
  const [action, setAction]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailOpen, setDetailOpen]   = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.audit.logs({ page, pageSize, search, module, action, dateFrom, dateTo }),
    queryFn:  () => auditApi.getLogs({ page, pageSize, search, module, action, dateFrom, dateTo }),
  });

  const logs  = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleView = (log: AuditLog) => { setSelectedLog(log); setDetailOpen(true); };

  return (
    <PageContainer
      title="Auditoría y Trazabilidad"
      subtitle="Registro inmutable de todas las acciones realizadas por usuarios y el sistema en el ERP."
    >
      {/* Filters */}
      <FiltersBar actions={<Badge color="gray">{total} eventos</Badge>}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar por usuario, entidad, descripción..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', width: '280px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select value={module} onChange={e => { setModule(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
          <option value="">Todos los Módulos</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
          <option value="">Todas las Acciones</option>
          {ACTIONS.map(a => <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />
        </div>

        {(search || module || action || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setModule(''); setAction(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
            Limpiar filtros
          </Button>
        )}
      </FiltersBar>

      {/* Immutability notice */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--blue-bg)', border: '1px solid var(--blue)', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--blue)' }}>
        <Shield size={16} />
        <span><strong>Registro Inmutable:</strong> Los eventos de auditoría no pueden ser modificados ni eliminados. Son un trazado fiel de toda la actividad del sistema.</span>
      </div>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={<Shield size={40} />}
            title="Sin Registros"
            message="No hay eventos de auditoría para los filtros seleccionados."
          />
        ) : (
          <Table
            keyField="id"
            data={logs}
            columns={[
              {
                key: 'date', header: 'Fecha y Hora',
                render: (l: AuditLog) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Clock size={13} />
                    {new Date(l.createdAt).toLocaleString()}
                  </div>
                )
              },
              {
                key: 'action', header: 'Acción',
                render: (l: AuditLog) => {
                  const m = ACTION_META[l.action] ?? { label: l.action, color: 'gray', icon: null };
                  return (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Badge color={m.color as any}>
                        {m.icon} {m.label}
                      </Badge>
                    </div>
                  );
                }
              },
              {
                key: 'module', header: 'Módulo',
                render: (l: AuditLog) => <Badge color="gray">{l.module}</Badge>
              },
              {
                key: 'entity', header: 'Entidad',
                render: (l: AuditLog) => (
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{l.entityType}</span>
                    {l.entityId && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: '6px' }}>·{l.entityId.split('-')[0]}</span>}
                  </div>
                )
              },
              {
                key: 'user', header: 'Usuario',
                render: (l: AuditLog) => (
                  <div>
                    <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: '13px' }}>{l.userName}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{l.userEmail}</p>
                  </div>
                )
              },
              {
                key: 'description', header: 'Descripción',
                render: (l: AuditLog) => (
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', maxWidth: '300px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.description}
                  </span>
                )
              },
              {
                key: 'ip', header: 'IP',
                render: (l: AuditLog) => <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{l.ipAddress || '—'}</span>
              },
              {
                key: 'changes', header: 'Cambios',
                render: (l: AuditLog) => l.changes && Object.keys(l.changes).length > 0
                  ? <div><Badge color="warning">{Object.keys(l.changes).length} campos</Badge></div>
                  : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
              },
              {
                key: 'actions', header: '',
                render: (l: AuditLog) => (
                  <Button variant="ghost" size="sm" onClick={() => handleView(l)} icon={<Eye size={16} />} aria-label="Ver detalle" />
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <AuditLogDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        log={selectedLog}
      />
    </PageContainer>
  );
}
