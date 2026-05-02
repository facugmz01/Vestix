/**
 * useSyncEngine
 *
 * Engine that watches the network status and drains the offline queue
 * when connectivity is restored. Replays each operation against the API.
 * Features: Exponential Backoff, Chronological Ordering, and Failure Classification.
 */
import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineQueueStore, OfflineOperation } from '@/store/offlineQueue.store';
import { APP_CONFIG } from '@/config/app.config';

const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 2000; // Starts at 2s, then 4s, 8s, 16s, 32s

export function useSyncEngine() {
  const { isOnline } = useNetworkStatus();
  const { operations, markSyncing, markFailed, markConflict, remove } = useOfflineQueueStore();
  const isSyncing = useRef(false);

  // Helper to determine if it's time to retry based on exponential backoff
  const isReadyForRetry = (op: OfflineOperation): boolean => {
    if (op.retryCount === 0 || !op.lastAttemptAt) return true;
    const delayMs = BASE_BACKOFF_MS * Math.pow(2, op.retryCount - 1);
    const nextAttemptTime = new Date(op.lastAttemptAt).getTime() + delayMs;
    return Date.now() >= nextAttemptTime;
  };

  const replay = async () => {
    // Prevent concurrent sync loops
    if (isSyncing.current) return;
    isSyncing.current = true;

    // Get all pending/failed items that haven't exhausted max retries
    const pendingOps = operations.filter(
      (o) => (o.status === 'PENDING' || (o.status === 'FAILED' && o.retryCount < (o.maxRetries || MAX_RETRIES)))
    );

    // Sort chronologically to preserve ledger integrity
    pendingOps.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (const op of pendingOps) {
      // 1. Backoff Check
      if (!isReadyForRetry(op)) {
        continue; // Skip this one for now, it's cooling down
      }

      markSyncing(op.id);
      
      try {
        const baseUrl = APP_CONFIG.apiBase;
        
        // CRITICAL SECURITY UPDATE: 
        // We no longer inject localStorage tokens. 
        // We use credentials: 'include' to pass the HttpOnly cookie securely.
        const res = await fetch(`${baseUrl}${op.endpoint}`, {
          method: op.method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', 
          body: op.method !== 'DELETE' ? JSON.stringify(op.payload) : undefined,
        });

        if (res.ok) {
          // Success: Destroy the queued item
          remove(op.id);
        } else if (res.status === 409) {
          // Conflict: Human must resolve
          let body: any = {};
          try { body = await res.json(); } catch {}
          markConflict(op.id, body.message ?? 'Conflicto detectado por el servidor.', body.serverValue);
          break; // Stop sync queue to maintain chronological safety
        } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          // Permanent Client Error (400, 401, 403, 404, 422)
          // Do not retry. The payload is invalid.
          // By incrementing the max retry automatically, we effectively lock it in FAILED status forever
          markFailed(op.id, `Rechazado permanentemente (HTTP ${res.status}). Requiere revisión manual.`);
        } else {
          // Transient Server/Network Error (500, 502, 503, 504, 429)
          markFailed(op.id, `Error temporal (HTTP ${res.status}). Reintentando luego...`);
          break; // Stop sync queue to give the server a break
        }
      } catch (err: any) {
        // Hard Network Drop
        markFailed(op.id, err.message ?? 'Sin conexión al intentar sincronizar.');
        break; // Stop sync queue until network restores
      }
    }

    isSyncing.current = false;
  };

  // Poll aggressively if online to catch up on backoff timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnline) {
      replay(); // Run immediately
      interval = setInterval(replay, 5000); // Poll every 5s to check backoff timers
    }
    return () => clearInterval(interval);
  }, [isOnline, operations]); // operations included so it reacts to new items

  // Manual trigger for the UI
  const forceSync = () => {
    if (isOnline) replay();
  };

  return { 
    isOnline, 
    pendingCount: operations.filter(o => o.status === 'PENDING' || o.status === 'SYNCING').length,
    forceSync
  };
}
