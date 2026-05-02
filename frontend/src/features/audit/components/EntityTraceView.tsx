import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Plus, Edit2, Trash2,
  LogIn, LogOut, Eye, FileText, Ban, Clock
} from 'lucide-react';
import { auditApi } from '@/api/audit.api';
import { queryKeys } from '@/api/queryKeys';

interface Props { entityType: string; entityId: string; }

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATE:  { label: 'Creación',    color: '#22c55e', icon: <Plus size={14} /> },
  UPDATE:  { label: 'Edición',     color: '#3b82f6', icon: <Edit2 size={14} /> },
  DELETE:  { label: 'Eliminación', color: '#ef4444', icon: <Trash2 size={14} /> },
  LOGIN:   { label: 'Ingreso',     color: '#22c55e', icon: <LogIn size={14} /> },
  LOGOUT:  { label: 'Cierre',      color: '#6b7280', icon: <LogOut size={14} /> },
  ACCESS:  { label: 'Acceso',      color: '#6b7280', icon: <Eye size={14} /> },
  APPROVE: { label: 'Aprobación',  color: '#22c55e', icon: <CheckCircle size={14} /> },
  REJECT:  { label: 'Rechazo',     color: '#ef4444', icon: <XCircle size={14} /> },
  ISSUE:   { label: 'Emisión',     color: '#3b82f6', icon: <FileText size={14} /> },
  CANCEL:  { label: 'Cancelación', color: '#f59e0b', icon: <Ban size={14} /> },
};

export function EntityTraceView({ entityType, entityId }: Props) {
  const { data: trace, isLoading } = useQuery({
    queryKey: queryKeys.audit.trace(entityType, entityId),
    queryFn: () => auditApi.getEntityTrace(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  if (isLoading) return <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando trazabilidad...</p>;
  if (!trace || trace.length === 0) return <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin eventos para este registro.</p>;

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      <div style={{ position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', background: 'var(--border)' }} />
      {trace.map((entry, idx) => {
        const meta = ACTION_META[entry.action] ?? { label: entry.action, color: 'var(--text-muted)', icon: <Clock size={14} /> };
        return (
          <div key={entry.id} style={{ position: 'relative', paddingBottom: idx < trace.length - 1 ? '24px' : 0, paddingLeft: '8px' }}>
            <div style={{ position: 'absolute', left: '-24px', top: '2px', width: '24px', height: '24px', borderRadius: '50%', background: `${meta.color}22`, border: `2px solid ${meta.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
              {meta.icon}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: meta.color, fontSize: '13px' }}>{meta.label}</span>
                <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{entry.module}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '13px' }}>{entry.description}</p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>por <strong>{entry.userName}</strong></p>
            {entry.changes && Object.keys(entry.changes).length > 0 && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                {Object.entries(entry.changes).map(([field, diff]) => (
                  <div key={field} style={{ display: 'flex', gap: '8px', fontSize: '12px', fontFamily: 'monospace', marginBottom: '2px' }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: '120px' }}>{field}:</span>
                    <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{String(diff.before ?? '—')}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>{String(diff.after ?? '—')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
