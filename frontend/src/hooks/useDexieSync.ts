import { useEffect, useCallback, useRef, useState } from 'react';
import { db } from '@/core/db/db';
import { salesApi } from '@/api/sales.api';
import { CatalogSyncService } from '@/core/sync/CatalogSyncService';
import toast from 'react-hot-toast';

export function useDexieSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  const checkConnectivity = useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || syncInProgress.current) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const items = await db.syncQueue.orderBy('id').toArray();
      const pendingItems = items.filter(i => i.status === 'PENDING' || (i.status === 'ERROR' && i.retryCount < 5));

      for (const item of pendingItems) {
        if (!navigator.onLine) break; // Network dropped during loop

        try {
          if (item.type === 'SALE') {
            await salesApi.createSale(item.payload);
          }
          // Remove from queue upon success
          if (item.id) {
            await db.syncQueue.delete(item.id);
          }
        } catch (error: any) {
          // If conflict or fatal client error
          if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
            if (item.id) {
              await db.syncQueue.update(item.id, {
                status: 'ERROR',
                lastError: error.response?.data?.message || 'Error de validación (Fatal)',
                retryCount: 999 // Stop retrying
              });
            }
          } else {
            // Transient error
            if (item.id) {
              await db.syncQueue.update(item.id, {
                retryCount: item.retryCount + 1,
                lastError: error.message || 'Error temporal'
              });
            }
            break; // Stop loop, network/server is having issues
          }
        }
      }
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('online', checkConnectivity);
    window.addEventListener('offline', checkConnectivity);
    window.addEventListener('online', syncQueue);

    // Initial check
    if (navigator.onLine) {
      syncQueue();
      CatalogSyncService.syncPosCatalog().catch(() => {
        // Silent fail — POS can still use live search when online
      });
    }

    return () => {
      window.removeEventListener('online', checkConnectivity);
      window.removeEventListener('offline', checkConnectivity);
      window.removeEventListener('online', syncQueue);
    };
  }, [checkConnectivity, syncQueue]);

  return { isOnline, isSyncing, forceSync: syncQueue };
}
