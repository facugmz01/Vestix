import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { db, SyncQueueItem } from '../db/db';
import { apiClient } from '../api/apiClient';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  enqueueSale: (payload: any) => Promise<void>;
  forceSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await db.syncQueue.where('status').equals('PENDING').count();
    setPendingCount(count);
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  // Background Sync Worker Loop
  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Get all pending items ordered by createdAt (oldest first)
      const pendingItems = await db.syncQueue.where('status').equals('PENDING').sortBy('createdAt');
      
      if (pendingItems.length === 0) {
        setIsSyncing(false);
        return;
      }

      for (const item of pendingItems) {
        try {
          // Attempt to send to backend based on type
          if (item.type === 'SALE') {
            await apiClient.post('/sales', item.payload);
          } else if (item.type === 'SALE_RETURN') {
            await apiClient.post('/sales/returns', item.payload);
          }

          // If success, remove from queue
          await db.syncQueue.delete(item.id!);
        } catch (error: any) {
          console.error(`[Sync] Failed to sync item ${item.id}`, error);
          // Update retry count and last error, but keep it pending for now
          // Could implement max retries to move to ERROR status
          await db.syncQueue.update(item.id!, {
            retryCount: item.retryCount + 1,
            lastError: error.message || 'Unknown error',
            ...(item.retryCount >= 5 ? { status: 'ERROR' } : {}) // Mark as error after 5 retries
          });
          
          // Break the loop on network failure to avoid spamming
          if (error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
            break; 
          }
        }
      }
    } finally {
      setIsSyncing(false);
      updatePendingCount();
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  // Enqueue a new sale
  const enqueueSale = async (payload: any) => {
    const item: SyncQueueItem = {
      type: 'SALE',
      payload,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      retryCount: 0,
    };
    await db.syncQueue.add(item);
    updatePendingCount();
    
    // Attempt to sync immediately if online
    if (isOnline) {
      processQueue();
    }
  };

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount, enqueueSale, forceSync: processQueue }}>
      {children}
    </SyncContext.Provider>
  );
};
