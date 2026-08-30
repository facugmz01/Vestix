/**
 * offlineQueue.store.ts
 *
 * Zustand store that persists pending API operations asynchronously to IndexedDB.
 * Safely supports large offline datasets (hundreds of offline sales) without 
 * hitting the 5MB localStorage limit or blocking the main UI thread.
 */
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { generateUUID } from '@/utils/generateUUID';

// ─── Custom IndexedDB Storage Driver ──────────────────────────────────────────
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export type OfflineOpStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT';

export interface OfflineOperation {
  id: string;             // uuid
  createdAt: string;      // ISO
  status: OfflineOpStatus;
  retryCount: number;
  maxRetries: number;

  // Operation descriptor (what to replay when online)
  module: string;         // e.g. 'POS', 'Inventory'
  action: string;         // e.g. 'createSale', 'updateStock'
  description: string;    // Human-readable, e.g. "Venta en caja 1 por $4500"
  endpoint: string;       // POST /sales, PATCH /inventory/:id, etc.
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: unknown;       // Serializable body to send

  // Conflict resolution (populated by sync engine on 409)
  conflictReason?: string;
  serverValue?: unknown;
  localValue?: unknown;

  // Error info
  lastErrorMessage?: string;
  lastAttemptAt?: string;
}

interface OfflineQueueState {
  operations: OfflineOperation[];
  enqueue:      (op: Omit<OfflineOperation, 'id' | 'createdAt' | 'status' | 'retryCount'>) => void;
  markSyncing:  (id: string) => void;
  markFailed:   (id: string, errorMessage: string) => void;
  markConflict: (id: string, reason: string, serverValue: unknown) => void;
  remove:       (id: string) => void;
  resetStatus:  (id: string) => void;
  clearAll:     () => void;
  pendingCount: () => number;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      operations: [],

      enqueue: (op) => set((s) => ({
        operations: [
          ...s.operations,
          {
            ...op,
            id: generateUUID(),
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            retryCount: 0,
          }
        ],
      })),

      markSyncing: (id) => set((s) => ({
        operations: s.operations.map((o) =>
          o.id === id ? { ...o, status: 'SYNCING', lastAttemptAt: new Date().toISOString() } : o
        ),
      })),

      markFailed: (id, errorMessage) => set((s) => ({
        operations: s.operations.map((o) =>
          o.id === id
            ? { ...o, status: 'FAILED', retryCount: o.retryCount + 1, lastErrorMessage: errorMessage }
            : o
        ),
      })),

      markConflict: (id, reason, serverValue) => set((s) => ({
        operations: s.operations.map((o) =>
          o.id === id ? { ...o, status: 'CONFLICT', conflictReason: reason, serverValue } : o
        ),
      })),

      remove: (id) => set((s) => ({
        operations: s.operations.filter((o) => o.id !== id),
      })),

      resetStatus: (id) => set((s) => ({
        operations: s.operations.map((o) =>
          o.id === id ? { ...o, status: 'PENDING', lastErrorMessage: undefined } : o
        ),
      })),

      clearAll: () => set({ operations: [] }),

      pendingCount: () =>
        get().operations.filter((o) => o.status === 'PENDING' || o.status === 'SYNCING').length,
    }),
    {
      name: 'erp-offline-queue',
      // CRITICAL: Wire up IndexedDB wrapper
      storage: createJSONStorage(() => idbStorage),
      // Only persist operations — status gets reset on reload if needed
      partialize: (state) => ({ operations: state.operations }),
    }
  )
);
