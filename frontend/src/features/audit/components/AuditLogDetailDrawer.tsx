import { Drawer, Badge } from '@/components/ui';
import type { AuditLog } from '@/types';
import {
  Plus, Edit2, Trash2, LogIn, LogOut, Eye, CheckCircle,
  XCircle, FileText, Ban, Clock, User, Monitor
} from 'lucide-react';
import { formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

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
    <div className={styles.diffRow}>
      <span className={styles.diffBefore}>{String(before)}</span>
      <span className={styles.traceDiffArrow}>→</span>
      <span className={styles.diffAfter}>{String(after)}</span>
    </div>
  );
}

export function AuditLogDetailDrawer({ open, onClose, log }: Props) {
  if (!log) return <Drawer open={open} onClose={onClose} title="..." width="md"><div /></Drawer>;

  const actionMeta = ACTION_META[log.action] ?? { label: log.action, color: 'gray', icon: <Clock size={14} /> };
  const changesEntries = log.changes ? Object.entries(log.changes) : [];

  return (
    <Drawer open={open} onClose={onClose} title="Detalle del Evento de Auditoría" width="md">
      <div className={styles.formStackMd}>
        <div className={styles.auditHero}>
          <div className={styles.auditHeroTop}>
            <div>
              <div className={styles.badgeRow}>
                <Badge color={actionMeta.color as 'green' | 'blue' | 'red' | 'gray' | 'orange'}>
                  <span className={styles.badgeInner}>{actionMeta.icon} {actionMeta.label}</span>
                </Badge>
              </div>
              <h3 className={styles.auditHeroTitle}>{log.description}</h3>
              <p className={styles.auditHeroTime}>
                <Clock size={12} /> {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
            <Badge color="gray">{log.module}</Badge>
          </div>

          <div className={styles.auditMetaGrid}>
            <div>
              <p className={styles.auditMetaLabel}>Usuario</p>
              <div className={styles.auditMetaValue}>
                <User size={14} /> {log.userName}
              </div>
              <p className={styles.auditMetaSub}>{log.userEmail}</p>
            </div>

            <div>
              <p className={styles.auditMetaLabel}>IP / Entidad</p>
              <div className={styles.auditMetaValue}>
                <Monitor size={14} /> {log.ipAddress || 'Sistema Interno'}
              </div>
              {log.entityType && (
                <p className={styles.auditMetaSubMono}>
                  {log.entityType}{log.entityId ? ` · ${formatShortId(log.entityId)}` : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        {changesEntries.length > 0 && (
          <div>
            <h4 className={styles.changesTitle}>Cambios Detectados</h4>
            <div className={styles.historyTableWrap}>
              <table className={styles.lineItemsTable}>
                <thead>
                  <tr className={styles.changesTableHead}>
                    <th className={styles.changesTh}>Campo</th>
                    <th className={styles.changesTh}>Antes → Después</th>
                  </tr>
                </thead>
                <tbody>
                  {changesEntries.map(([field, diff]) => (
                    <tr key={field} className={styles.changesTr}>
                      <td className={styles.changesTdField}>{field}</td>
                      <td className={styles.changesTd}>{renderDiff(diff.before, diff.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {changesEntries.length === 0 && (
          <div className={styles.emptyAuditChanges}>
            No hay detalle de cambios para este evento.
          </div>
        )}
      </div>
    </Drawer>
  );
}
