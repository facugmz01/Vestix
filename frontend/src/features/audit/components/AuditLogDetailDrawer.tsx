import { Drawer, Badge } from '@/components/ui';
import type { AuditLog } from '@/types';
import {
  Plus, Edit2, Trash2, LogIn, LogOut, Eye, CheckCircle,
  XCircle, FileText, Ban, Clock, User, Monitor
} from 'lucide-react';
import { formatShortId } from '@/utils/formatId';

interface Props {
  open: boolean;
  onClose: () => void;
  log: AuditLog | null;
}

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATE:  { label: 'Creación',   color: 'green',  icon: <Plus size={14} /> },
  UPDATE:  { label: 'Edición',    color: 'blue',   icon: <Edit2 size={14} /> },
  DELETE:  { label: 'Eliminación',color: 'red',    icon: <Trash2 size={14} /> },
  LOGIN:   { label: 'Ingreso',    color: 'green',  icon: <LogIn size={14} /> },
  LOGOUT:  { label: 'Cierre',     color: 'gray',   icon: <LogOut size={14} /> },
  ACCESS:  { label: 'Acceso',     color: 'gray',   icon: <Eye size={14} /> },
  APPROVE: { label: 'Aprobación', color: 'green',  icon: <CheckCircle size={14} /> },
  REJECT:  { label: 'Rechazo',    color: 'red',    icon: <XCircle size={14} /> },
  ISSUE:   { label: 'Emisión',    color: 'blue',   icon: <FileText size={14} /> },
  CANCEL:  { label: 'Cancelación',color: 'orange', icon: <Ban size={14} /> },
};

function renderDiff(before: unknown, after: unknown): React.ReactNode {
  if (before === null || before === undefined) before = '—';
  if (after === null || after === undefined) after = '—';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
      <span style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '2px 6px', borderRadius: '4px' }}>
        {String(before)}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>→</span>
      <span style={{ background: 'var(--green-bg)', color: 'var(--green)', padding: '2px 6px', borderRadius: '4px' }}>
        {String(after)}
      </span>
    </div>
  );
}

export function AuditLogDetailDrawer({ open, onClose, log }: Props) {
  if (!log) return <Drawer open={open} onClose={onClose} title="..." width="md"><div /></Drawer>;

  const actionMeta = ACTION_META[log.action] ?? { label: log.action, color: 'gray', icon: <Clock size={14} /> };
  const changesEntries = log.changes ? Object.entries(log.changes) : [];

  return (
    <Drawer open={open} onClose={onClose} title="Detalle del Evento de Auditoría" width="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Event header */}
        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                <Badge color={actionMeta.color as any}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{actionMeta.icon} {actionMeta.label}</span>
                </Badge>
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>{log.description}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge color="gray">{log.module}</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Usuario</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px' }}>
                <User size={14} /> {log.userName}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{log.userEmail}</p>
            </div>

            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IP / Entidad</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <Monitor size={14} /> {log.ipAddress || 'Sistema Interno'}
              </div>
              {log.entityType && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  {log.entityType}{log.entityId ? ` · ${formatShortId(log.entityId)}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Changes diff */}
        {changesEntries.length > 0 && (
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700 }}>Cambios Detectados</h4>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Campo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase' }}>Antes → Después</th>
                  </tr>
                </thead>
                <tbody>
                  {changesEntries.map(([field, diff]) => (
                    <tr key={field} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{field}</td>
                      <td style={{ padding: '12px 16px' }}>{renderDiff(diff.before, diff.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {changesEntries.length === 0 && (
          <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No hay detalle de cambios para este evento.
          </div>
        )}

      </div>
    </Drawer>
  );
}
