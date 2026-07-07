import { useEffect, useCallback, useRef, useState } from 'react';
import { db } from '@/core/db/db';
import { salesApi } from '@/api/sales.api';
import { CatalogSyncService } from '@/core/sync/CatalogSyncService';
import { useAuthStore } from '@/store/auth.store';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import toast from 'react-hot-toast';

export function useDexieSync(branchIdOverride?: string) {
  const authBranchId = useAuthStore(s => s.user?.branchId);
  const branchId = branchIdOverride ?? authBranchId ?? undefined;
  const { isOnline, connectivityChecked } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
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

  const syncCatalog = useCallback(async (forceFull = false) => {
    if (!isOnline) return null;
    try {
      const result = await CatalogSyncService.syncPosCatalog(branchId, forceFull);
      await refreshMeta();
      return result;
    } catch {
      return null;
    }
  }, [branchId, isOnline, refreshMeta]);

  const syncQueue = useCallback(async () => {
    if (!isOnline || syncInProgress.current) return;

    syncInProgress.current = true;
    setIsSyncing(true);

    let synced = 0;
    try {
      const items = await db.syncQueue.orderBy('id').toArray();
      const pendingItems = items.filter(i => i.status === 'PENDING' || (i.status === 'ERROR' && i.retryCount < 5));

      for (const item of pendingItems) {
        if (!isOnline) break;

        try {
          if (item.type === 'SALE') {
            await salesApi.createSale(item.payload as unknown as Parameters<typeof salesApi.createSale>[0]);
          }
          if (item.id) {
            await db.syncQueue.delete(item.id);
          }
          synced++;
        } catch (error: unknown) {
          const axiosErr = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
          if (axiosErr.response && axiosErr.response.status! >= 400 && axiosErr.response.status! < 500 && axiosErr.response.status !== 429) {
            if (item.id) {
              await db.syncQueue.update(item.id, {
                status: 'ERROR',
                lastError: axiosErr.response?.data?.message || 'Error de validación',
                retryCount: 999,
              });
            }
          } else if (item.id) {
            await db.syncQueue.update(item.id, {
              retryCount: item.retryCount + 1,
              lastError: axiosErr.message || 'Error temporal',
            });
            break;
          }
        }
      }

      if (synced > 0) {
        toast.success(`${synced} venta(s) sincronizada(s)`);
      }
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
      await refreshMeta();
    }
  }, [isOnline, refreshMeta]);

  const runOnlineBootstrap = useCallback(async () => {
    await syncCatalog(false);
    await syncQueue();
  }, [syncCatalog, syncQueue]);

  useEffect(() => {
    refreshMeta();
  }, [refreshMeta]);

  useEffect(() => {
    if (isOnline && connectivityChecked) {
      runOnlineBootstrap();
    }
  }, [isOnline, connectivityChecked, runOnlineBootstrap]);

  return {
    isOnline,
    connectivityChecked,
    isSyncing,
    lastCatalogSync,
    catalogCount,
    forceSync: syncQueue,
    forceCatalogSync: syncCatalog,
    refreshMeta,
  };
}
