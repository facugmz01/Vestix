import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Plus, Edit2, Trash2,
  LogIn, LogOut, Eye, FileText, Ban, Clock
} from 'lucide-react';
import { auditApi } from '@/api/audit.api';
import { queryKeys } from '@/api/queryKeys';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props { entityType: string; entityId: string; }

const ACTION_META: Record<string, { label: string; dotClass: string; labelClass: string; icon: React.ReactNode }> = {
  CREATE:  { label: 'Creación',    dotClass: styles.traceDotGreen,  labelClass: styles.traceLabelGreen,  icon: <Plus size={14} /> },
  UPDATE:  { label: 'Edición',     dotClass: styles.traceDotBlue,   labelClass: styles.traceLabelBlue,   icon: <Edit2 size={14} /> },
  DELETE:  { label: 'Eliminación', dotClass: styles.traceDotRed,    labelClass: styles.traceLabelRed,    icon: <Trash2 size={14} /> },
  LOGIN:   { label: 'Ingreso',     dotClass: styles.traceDotGreen,  labelClass: styles.traceLabelGreen,  icon: <LogIn size={14} /> },
  LOGOUT:  { label: 'Cierre',      dotClass: styles.traceDotGray,   labelClass: styles.traceLabelGray,   icon: <LogOut size={14} /> },
  ACCESS:  { label: 'Acceso',      dotClass: styles.traceDotGray,   labelClass: styles.traceLabelGray,   icon: <Eye size={14} /> },
  APPROVE: { label: 'Aprobación',  dotClass: styles.traceDotGreen,  labelClass: styles.traceLabelGreen,  icon: <CheckCircle size={14} /> },
  REJECT:  { label: 'Rechazo',     dotClass: styles.traceDotRed,    labelClass: styles.traceLabelRed,    icon: <XCircle size={14} /> },
  ISSUE:   { label: 'Emisión',     dotClass: styles.traceDotBlue,   labelClass: styles.traceLabelBlue,   icon: <FileText size={14} /> },
  CANCEL:  { label: 'Cancelación', dotClass: styles.traceDotOrange, labelClass: styles.traceLabelOrange, icon: <Ban size={14} /> },
};

export function EntityTraceView({ entityType, entityId }: Props) {
  const { data: trace, isLoading } = useQuery({
    queryKey: queryKeys.audit.trace(entityType, entityId),
    queryFn: () => auditApi.getEntityTrace(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  if (isLoading) return <p className={styles.emptyCenter}>Cargando trazabilidad...</p>;
  if (!trace || trace.length === 0) return <p className={styles.emptyCenter}>Sin eventos para este registro.</p>;

  return (
    <div className={styles.timeline}>
      <div className={styles.timelineLine} />
      {trace.map((entry, idx) => {
        const meta = ACTION_META[entry.action] ?? {
          label: entry.action,
          dotClass: styles.traceDotGray,
          labelClass: styles.traceLabelMuted,
          icon: <Clock size={14} />,
        };
        return (
          <div key={entry.id} className={idx < trace.length - 1 ? styles.timelineItemSpaced : styles.timelineItem}>
            <div className={clsx(styles.timelineDot, meta.dotClass)}>
              {meta.icon}
            </div>
            <div className={styles.traceHeader}>
              <div className={styles.traceHeaderLeft}>
                <span className={clsx(styles.traceActionLabel, meta.labelClass)}>{meta.label}</span>
                <span className={styles.traceModule}>{entry.module}</span>
              </div>
              <span className={styles.traceTime}>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p className={styles.traceDesc}>{entry.description}</p>
            <p className={styles.traceUser}>por <strong>{entry.userName}</strong></p>
            {entry.changes && Object.keys(entry.changes).length > 0 && (
              <div className={styles.traceDiffBox}>
                {Object.entries(entry.changes).map(([field, diff]) => (
                  <div key={field} className={styles.traceDiffRow}>
                    <span className={styles.traceDiffField}>{field}:</span>
                    <span className={styles.traceDiffBefore}>{String(diff.before ?? '—')}</span>
                    <span className={styles.traceDiffArrow}>→</span>
                    <span className={styles.traceDiffAfter}>{String(diff.after ?? '—')}</span>
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
