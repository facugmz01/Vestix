import { useLiveQuery } from 'dexie-react-hooks';
import { Cloud, CloudOff, RefreshCw, Database } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { db } from '@/core/db/db';
import { CatalogSyncService } from '@/core/sync/CatalogSyncService';
import toast from 'react-hot-toast';
import styles from '@/features/offline/components/SyncStatusIndicator.module.css';

interface SyncPanelProps {
  open: boolean;
  onClose: () => void;
  branchId?: string;
  isOnline: boolean;
  isSyncing: boolean;
  lastCatalogSync: string | null;
  catalogCount: number;
  onForceSync: () => Promise<void>;
  onForceCatalogSync?: (full?: boolean) => Promise<unknown>;
}

export function PosSyncPanel({
  open,
  onClose,
  branchId,
  isOnline,
  isSyncing,
  lastCatalogSync,
  catalogCount,
  onForceSync,
  onForceCatalogSync,
}: SyncPanelProps) {
  const pendingItems = useLiveQuery(
    () => db.syncQueue.where('status').equals('PENDING').toArray(),
    [],
  );
  const errorItems = useLiveQuery(
    () => db.syncQueue.where('status').equals('ERROR').toArray(),
    [],
  );

  const handleCatalogSync = async (full: boolean) => {
    if (!navigator.onLine) {
      toast.error('Sin conexión — no se puede sincronizar catálogo');
      return;
    }
    try {
      const result = onForceCatalogSync
        ? await onForceCatalogSync(full)
        : await CatalogSyncService.syncPosCatalog(branchId, full);
      if (!result) return;
      const syncResult = result as { incremental?: boolean; itemCount: number; removed?: number };
      toast.success(
        syncResult.incremental
          ? `Catálogo actualizado (${syncResult.itemCount} ítems, ${syncResult.removed ?? 0} removidos)`
          : `Catálogo completo: ${syncResult.itemCount} productos`,
      );
    } catch {
      toast.error('Error al sincronizar catálogo');
    }
  };

  const lastSyncLabel = lastCatalogSync
    ? new Date(lastCatalogSync).toLocaleString('es-AR')
    : 'Nunca';

  return (
    <Modal open={open} onClose={onClose} title="Estado de sincronización">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px', borderRadius: '12px',
          background: isOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${isOnline ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        }}>
          {isOnline ? <Cloud size={24} color="#34d399" /> : <CloudOff size={24} color="#f87171" />}
          <div>
            <div style={{ fontWeight: 700 }}>{isOnline ? 'En línea' : 'Sin conexión'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {isOnline ? 'Ventas en tiempo real' : 'Modo offline — catálogo y cola local'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <StatCard icon={<Database size={18} />} label="Catálogo offline" value={String(catalogCount)} />
          <StatCard icon={<RefreshCw size={18} />} label="Ventas pendientes" value={String(pendingItems?.length ?? 0)} />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Última sync catálogo: <strong style={{ color: 'var(--text-primary)' }}>{lastSyncLabel}</strong>
        </div>

        {(errorItems?.length ?? 0) > 0 && (
          <div style={{
            padding: '12px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: '13px', color: '#f87171',
          }}>
            <strong>{errorItems!.length} operación(es) con error</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button
            variant="primary"
            onClick={onForceSync}
            loading={isSyncing}
            disabled={!isOnline || (pendingItems?.length ?? 0) === 0}
          >
            Sincronizar ventas ({pendingItems?.length ?? 0})
          </Button>
          <Button variant="ghost" onClick={() => handleCatalogSync(false)} disabled={!isOnline}>
            Actualizar catálogo (incremental)
          </Button>
          <Button variant="ghost" onClick={() => handleCatalogSync(true)} disabled={!isOnline}>
            Descargar catálogo completo
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{
      padding: '14px', borderRadius: '12px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '6px' }}>
        {icon}
        <span style={{ fontSize: '12px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export function SyncStatusIndicatorClickable({
  onClick,
  isOnline,
  pendingCount,
  catalogCount,
}: {
  onClick: () => void;
  isOnline: boolean;
  pendingCount: number;
  catalogCount: number;
}) {
  const isSyncing = isOnline && pendingCount > 0;
  const offlineReady = catalogCount > 0;

  const title = isOnline
    ? pendingCount
      ? `Sincronizando ${pendingCount} pendiente(s)`
      : `En línea · ${catalogCount} productos offline`
    : offlineReady
      ? `Sin conexión · ${catalogCount} productos offline`
      : 'Sin conexión · descargá el catálogo cuando tengas red';

  const className = isOnline
    ? pendingCount ? styles.syncing : styles.online
    : offlineReady ? styles.offlineReady : styles.offline;

  return (
    <button type="button" className={`${styles.indicator} ${styles.clickable} ${className}`} title={title} onClick={onClick}>
      {isOnline ? (
        pendingCount ? <RefreshCw size={18} className={styles.spin} /> : <Cloud size={18} />
      ) : (
        <CloudOff size={18} />
      )}
      {pendingCount > 0 && <span className={styles.count}>{pendingCount}</span>}
      {!isOnline && offlineReady && pendingCount === 0 && (
        <span className={styles.count}>{catalogCount}</span>
      )}
    </button>
  );
}
