/**
 * SyncQueuePanel
 *
 * Full detail view of the offline operation queue.
 * Shows all pending, syncing, failed and conflict operations.
 * Allows retry and manual dismissal.
 */
import { useOfflineQueueStore, type OfflineOperation } from '@/store/offlineQueue.store';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import {
  Clock, RefreshCw, XCircle, AlertTriangle, CheckCircle, Wifi, WifiOff, Trash2, RotateCcw
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:  { label: 'Pendiente',  color: 'orange', icon: <Clock size={14} /> },
  SYNCING:  { label: 'Enviando…',  color: 'blue',   icon: <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: isOnline ? 'var(--green-bg)' : 'var(--red-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isOnline
            ? <Wifi size={20} color="var(--green)" />
            : <WifiOff size={20} color="var(--red)" />
          }
          <div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '15px', color: isOnline ? 'var(--green)' : 'var(--red)' }}>
              {isOnline ? 'Conectado — Sincronización Activa' : 'Sin Conexión — Modo Offline'}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              {operations.length} operación(es) en cola · {grouped.pending.length + grouped.syncing.length} pendientes
            </p>
          </div>
        </div>
        {operations.length > 0 && (
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={clearAll} style={{ color: 'var(--red)' }}>
            Limpiar todo
          </Button>
        )}
      </div>

      {/* Empty */}
      {operations.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <CheckCircle size={40} color="var(--green)" style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>Sin Operaciones Pendientes</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Todo está sincronizado con el servidor.</p>
        </div>
      )}

      {/* Operation list */}
      {operations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {operations.map(op => <OperationCard key={op.id} op={op} onRetry={() => resetStatus(op.id)} onRemove={() => remove(op.id)} />)}
        </div>
      )}

    </div>
  );
}

// ── Single Operation Card ──────────────────────────────────────────────────────

function OperationCard({ op, onRetry, onRemove }: { op: OfflineOperation; onRetry: () => void; onRemove: () => void }) {
  const meta = STATUS_META[op.status];

  return (
    <div style={{
      border: op.status === 'CONFLICT' ? '2px solid var(--orange)' : op.status === 'FAILED' ? '2px solid var(--red)' : '1px solid var(--border)',
      borderRadius: '10px', padding: '16px 20px', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge color={meta.color as any}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{meta.icon} {meta.label}</span>
            </Badge>
            <Badge color="gray">{op.module}</Badge>
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{op.description}</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
            {op.method} {op.endpoint}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {(op.status === 'FAILED' || op.status === 'CONFLICT') && (
            <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onRetry}>Reintentar</Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove} style={{ color: 'var(--red)' }}>
            <XCircle size={16} />
          </Button>
        </div>
      </div>

      {/* Error info */}
      {op.lastErrorMessage && (
        <div style={{ padding: '8px 12px', background: 'var(--red-bg)', borderRadius: '6px', border: '1px solid var(--red)', fontSize: '12px', color: 'var(--red)' }}>
          <strong>Error:</strong> {op.lastErrorMessage}
          {op.retryCount > 0 && <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>({op.retryCount} intento(s))</span>}
        </div>
      )}

      {/* Conflict view */}
      {op.status === 'CONFLICT' && (
        <div style={{ padding: '12px', background: 'var(--orange-bg)', borderRadius: '6px', border: '1px solid var(--orange)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--orange)', fontSize: '13px' }}>
            Conflicto de datos: {op.conflictReason}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-secondary)' }}>Tus cambios (Local)</p>
              <pre style={{ margin: 0, background: 'var(--bg-base)', padding: '8px', borderRadius: '4px', overflowX: 'auto', fontSize: '11px' }}>
                {JSON.stringify(op.localValue ?? op.payload, null, 2)}
              </pre>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-secondary)' }}>Valor del Servidor</p>
              <pre style={{ margin: 0, background: 'var(--bg-base)', padding: '8px', borderRadius: '4px', overflowX: 'auto', fontSize: '11px' }}>
                {JSON.stringify(op.serverValue, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
        Creado: {new Date(op.createdAt).toLocaleString()}
        {op.lastAttemptAt && ` · Último intento: ${new Date(op.lastAttemptAt).toLocaleString()}`}
      </p>
    </div>
  );
}
