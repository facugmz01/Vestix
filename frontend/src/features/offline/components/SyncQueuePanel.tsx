/**
 * SyncQueuePanel
 *
 * Full detail view of the offline operation queue.
 * Shows all pending, syncing, failed and conflict operations.
 * Allows retry and manual dismissal.
 */
import clsx from 'clsx';
import { useOfflineQueueStore, type OfflineOperation } from '@/store/offlineQueue.store';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  Clock, RefreshCw, XCircle, AlertTriangle, CheckCircle, Wifi, WifiOff, Trash2, RotateCcw
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import styles from './OfflineShared.module.css';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Pendiente',  color: 'orange', icon: <Clock size={14} /> },
  SYNCING:  { label: 'Enviando…',  color: 'blue',   icon: <RefreshCw size={14} className={styles.spinIcon} /> },
  FAILED:   { label: 'Con Error',  color: 'red',    icon: <XCircle size={14} /> },
  CONFLICT: { label: 'Conflicto',  color: 'red',    icon: <AlertTriangle size={14} /> },
};

export function SyncQueuePanel() {
  const { isOnline } = useNetworkStatus();
  const { operations, remove, resetStatus, clearAll } = useOfflineQueueStore();

  const grouped = {
    pending:  operations.filter(o => o.status === 'PENDING'),
    syncing:  operations.filter(o => o.status === 'SYNCING'),
    failed:   operations.filter(o => o.status === 'FAILED'),
    conflict: operations.filter(o => o.status === 'CONFLICT'),
  };

  return (
    <div className={styles.panel}>
      <div className={clsx(styles.statusHeader, isOnline ? styles.statusOnline : styles.statusOffline)}>
        <div className={styles.statusRow}>
          {isOnline
            ? <Wifi size={20} color="var(--green)" />
            : <WifiOff size={20} color="var(--red)" />
          }
          <div>
            <p className={clsx(styles.statusTitle, isOnline ? styles.statusTitleOnline : styles.statusTitleOffline)}>
              {isOnline ? 'Conectado — Sincronización Activa' : 'Sin Conexión — Modo Offline'}
            </p>
            <p className={styles.statusMeta}>
              {operations.length} operación(es) en cola · {grouped.pending.length + grouped.syncing.length} pendientes
            </p>
          </div>
        </div>
        {operations.length > 0 && (
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearAll} className={styles.btnDanger}>
            Limpiar todo
          </Button>
        )}
      </div>

      {operations.length === 0 && (
        <div className={styles.emptyState}>
          <CheckCircle size={40} color="var(--green)" className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Sin Operaciones Pendientes</p>
          <p className={styles.emptyText}>Todo está sincronizado con el servidor.</p>
        </div>
      )}

      {operations.length > 0 && (
        <div className={styles.opList}>
          {operations.map(op => <OperationCard key={op.id} op={op} onRetry={() => resetStatus(op.id)} onRemove={() => remove(op.id)} />)}
        </div>
      )}
    </div>
  );
}

function OperationCard({ op, onRetry, onRemove }: { op: OfflineOperation; onRetry: () => void; onRemove: () => void }) {
  const meta = STATUS_META[op.status];

  return (
    <div className={clsx(
      styles.opCard,
      op.status === 'CONFLICT' ? styles.opCardConflict : op.status === 'FAILED' ? styles.opCardFailed : styles.opCardDefault,
    )}>
      <div className={styles.opHeader}>
        <div className={styles.opBody}>
          <div className={styles.opBadges}>
            <Badge color={meta.color as any}>
              <span className={styles.badgeInner}>{meta.icon} {meta.label}</span>
            </Badge>
            <Badge color="gray">{op.module}</Badge>
          </div>
          <p className={styles.opTitle}>{op.description}</p>
          <p className={styles.opEndpoint}>
            {op.method} {op.endpoint}
          </p>
        </div>
        <div className={styles.opActions}>
          {(op.status === 'FAILED' || op.status === 'CONFLICT') && (
            <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onRetry}>Reintentar</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove} className={styles.btnDanger}>
            <XCircle size={16} />
          </Button>
        </div>
      </div>

      {op.lastErrorMessage && (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {op.lastErrorMessage}
          {op.retryCount > 0 && <span className={styles.retryCount}>({op.retryCount} intento(s))</span>}
        </div>
      )}

      {op.status === 'CONFLICT' && (
        <div className={styles.conflictBox}>
          <p className={styles.conflictTitle}>
            Conflicto de datos: {op.conflictReason}
          </p>
          <div className={styles.conflictGrid}>
            <div>
              <p className={styles.conflictColLabel}>Tus cambios (Local)</p>
              <pre className={styles.conflictPre}>
                {JSON.stringify(op.localValue ?? op.payload, null, 2)}
              </pre>
            </div>
            <div>
              <p className={styles.conflictColLabel}>Valor del Servidor</p>
              <pre className={styles.conflictPre}>
                {JSON.stringify(op.serverValue, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <p className={styles.timestamp}>
        Creado: {new Date(op.createdAt).toLocaleString()}
        {op.lastAttemptAt && ` · Último intento: ${new Date(op.lastAttemptAt).toLocaleString()}`}
      </p>
    </div>
  );
}
