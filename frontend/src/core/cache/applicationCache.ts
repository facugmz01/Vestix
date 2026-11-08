import { db } from '@/core/db/db';
import { queryClient } from '@/core/queryClient';

/**
 * Clears disposable application caches while keeping the offline operation
 * queue intact. Pending sales and other mutations live in a separate
 * IndexedDB entry and must never be removed by an update action.
 */
export async function clearApplicationCache(): Promise<void> {
  queryClient.clear();

  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
  }

  await db.transaction('rw', db.catalog, db.syncMeta, async () => {
    await db.catalog.clear();
    await db.syncMeta.clear();
  });
}
