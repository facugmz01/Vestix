/**
 * OfflineStatusBar
 *
 * Persistent top banner shown when the app detects no network connectivity.
 * Auto-dismisses when coming back online.
 * Mount this inside AdminLayout and StorefrontLayout.
 */
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { WifiOff, Clock } from 'lucide-react';
import clsx from 'clsx';
import styles from './OfflineStatusBar.module.css';

export function OfflineStatusBar() {
  const { isOnline } = useNetworkStatus();
  const operations   = useOfflineQueueStore((s) => s.operations);
  const pendingCount = operations.filter(o => o.status === 'PENDING' || o.status === 'SYNCING').length;

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div className={clsx(styles.offlineBanner, styles.offlineDisconnected)}>
        <WifiOff size={16} color="#ef4444" />
        <span>Sin conexión a Internet. Las operaciones se guardarán y sincronizarán al reconectarse.</span>
      </div>
    );
  }

  return (
    <div className={clsx(styles.offlineBanner, styles.syncing)}>
      <Clock size={14} color="#f59e0b" className={styles.spinIcon} />
      <span>Sincronizando {pendingCount} operación(es) pendiente(s)...</span>
    </div>
  );
}
