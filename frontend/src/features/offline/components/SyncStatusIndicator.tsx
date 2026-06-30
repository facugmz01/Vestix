import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/core/db/db';
import styles from './SyncStatusIndicator.module.css';

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pendingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('PENDING').count(),
    []
  );

  // Consider it "syncing" if online and there are items to process
  // The actual background sync logic is handled elsewhere, we just reflect the state.
  const isSyncing = isOnline && (pendingCount || 0) > 0;

  if (isOnline && pendingCount === 0) {
    return (
      <div className={`${styles.indicator} ${styles.online}`} title="Conexión estable. Todo está sincronizado.">
        <Cloud size={18} />
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={`${styles.indicator} ${styles.syncing}`} title="Sincronizando datos con el servidor...">
        <RefreshCw size={18} className={styles.spin} />
        <span className={styles.count}>{pendingCount}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.indicator} ${styles.offline}`} title="Sin conexión. Los datos se guardan localmente.">
      <CloudOff size={18} />
      <span className={styles.count}>{pendingCount} local(es)</span>
    </div>
  );
}
