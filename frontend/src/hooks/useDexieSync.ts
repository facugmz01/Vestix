import { useEffect, useCallback, useRef, useState } from 'react';
import { CatalogSyncService } from '@/core/sync/CatalogSyncService';
import { useAuthStore } from '@/store/auth.store';

/**
 * POS catalog sync hook — Dexie is used only for offline catalog cache.
 * Operation queue replay is handled globally by useSyncEngine + offlineQueue.store.
 */
export function useDexieSync(branchIdOverride?: string) {
  const authBranchId = useAuthStore(s => s.user?.branchId);
  const branchId = branchIdOverride ?? authBranchId ?? undefined;
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCatalogSyncing, setIsCatalogSyncing] = useState(false);
  const [lastCatalogSync, setLastCatalogSync] = useState<string | null>(null);
  const [catalogCount, setCatalogCount] = useState(0);
  const syncInProgress = useRef(false);

  const refreshMeta = useCallback(async () => {
    const [last, count] = await Promise.all([
      CatalogSyncService.getLastSyncAt(),
      CatalogSyncService.getCatalogCount(),
    ]);
    setLastCatalogSync(last);
    setCatalogCount(count);
  }, []);

  const checkConnectivity = useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  const syncCatalog = useCallback(async (forceFull = false) => {
    if (!navigator.onLine || syncInProgress.current) return null;

    syncInProgress.current = true;
    setIsCatalogSyncing(true);
    try {
      const result = await CatalogSyncService.syncPosCatalog(branchId, forceFull);
      await refreshMeta();
      return result;
    } catch {
      return null;
    } finally {
      syncInProgress.current = false;
      setIsCatalogSyncing(false);
    }
  }, [branchId, refreshMeta]);

  const runOnlineBootstrap = useCallback(async () => {
    await syncCatalog(false);
  }, [syncCatalog]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);
    window.addEventListener('online', runOnlineBootstrap);

    if (navigator.onLine) {
      runOnlineBootstrap();
    }

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
      window.removeEventListener('online', runOnlineBootstrap);
    };
  }, [checkConnectivity, runOnlineBootstrap]);

  return {
    isOnline,
    isCatalogSyncing,
    lastCatalogSync,
    catalogCount,
    forceCatalogSync: syncCatalog,
    refreshMeta,
  };
}
