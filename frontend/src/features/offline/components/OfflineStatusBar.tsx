/**
 * OfflineStatusBar
 *
 * Persistent top banner shown when the app detects no network connectivity.
 * Auto-dismisses when coming back online.
 * Mount this inside AdminLayout and StorefrontLayout.
 */
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { WifiOff, Wifi, Clock } from 'lucide-react';

export function OfflineStatusBar() {
  const { isOnline } = useNetworkStatus();
  const operations   = useOfflineQueueStore((s) => s.operations);
  const pendingCount = operations.filter(o => o.status === 'PENDING' || o.status === 'SYNCING').length;

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#1e293b', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        padding: '10px 16px', fontSize: '14px', fontWeight: 600,
        borderBottom: '2px solid #ef4444',
        animation: 'slideDown 0.3s ease',
      }}>
        <WifiOff size={16} color="#ef4444" />
        <span>Sin conexión a Internet. Las operaciones se guardarán y sincronizarán al reconectarse.</span>
      </div>
    );
  }

  // Online but still draining queue
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#0f172a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      padding: '8px 16px', fontSize: '13px', fontWeight: 600,
      borderBottom: '2px solid #f59e0b',
    }}>
      <Clock size={14} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
      <span>Sincronizando {pendingCount} operación(es) pendiente(s)...</span>
    </div>
  );
}
