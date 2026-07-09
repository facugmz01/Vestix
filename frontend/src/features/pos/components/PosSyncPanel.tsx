import { useLiveQuery } from 'dexie-react-hooks';
import { Cloud, CloudOff, RefreshCw, Database } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { db } from '@/core/db/db';
import { CatalogSyncService } from '@/core/sync/CatalogSyncService';
import toast from 'react-hot-toast';
import indicatorStyles from '@/features/offline/components/SyncStatusIndicator.module.css';
import styles from '@/pages/pos/POSPage.module.css';

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
      <div className={styles.syncStack}>
        <div className={`${styles.syncStatusBanner} ${isOnline ? styles.syncStatusOnline : styles.syncStatusOffline}`}>
          {isOnline ? <Cloud size={24} color="var(--green)" /> : <CloudOff size={24} color="var(--red)" />}
          <div>
            <div className={styles.syncStatusTitle}>{isOnline ? 'En línea' : 'Sin conexión'}</div>
            <div className={styles.syncStatusSub}>
              {isOnline ? 'Ventas en tiempo real' : 'Modo offline — catálogo y cola local'}
            </div>
          </div>
        </div>

        <div className={styles.syncStatGrid}>
          <StatCard icon={<Database size={18} />} label="Catálogo offline" value={String(catalogCount)} />
          <StatCard icon={<RefreshCw size={18} />} label="Ventas pendientes" value={String(pendingItems?.length ?? 0)} />
        </div>

        <div className={styles.syncMeta}>
          Última sync catálogo: <strong className={styles.syncMetaStrong}>{lastSyncLabel}</strong>
        </div>

        {(errorItems?.length ?? 0) > 0 && (
          <div className={styles.syncErrorBanner}>
            <strong>{errorItems!.length} operación(es) con error</strong>
          </div>
        )}

        <div className={styles.syncActions}>
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
    <div className={styles.syncStatCard}>
      <div className={styles.syncStatCardHeader}>
        {icon}
        <span className={styles.syncStatCardLabel}>{label}</span>
      </div>
      <div className={styles.syncStatCardValue}>{value}</div>
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
    ? pendingCount ? indicatorStyles.syncing : indicatorStyles.online
    : offlineReady ? indicatorStyles.offlineReady : indicatorStyles.offline;

  return (
    <button type="button" className={`${indicatorStyles.indicator} ${indicatorStyles.clickable} ${className}`} title={title} onClick={onClick}>
      {isOnline ? (
        pendingCount ? <RefreshCw size={18} className={indicatorStyles.spin} /> : <Cloud size={18} />
      ) : (
        <CloudOff size={18} />
      )}
      {pendingCount > 0 && <span className={indicatorStyles.count}>{pendingCount}</span>}
      {!isOnline && offlineReady && pendingCount === 0 && (
        <span className={indicatorStyles.count}>{catalogCount}</span>
      )}
    </button>
  );
}
