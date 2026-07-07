import Dexie, { Table } from 'dexie';

export interface PosCatalogItem {
  id: string;
  productId: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  brandName?: string;
  sku: string;
  primaryBarcode: string | null;
  allBarcodes: string[];
  price: number;
  stock: number;
  imageUrl?: string | null;
  size: string | null;
  color: string | null;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  type: 'SALE' | 'SALE_RETURN' | 'CREATE_CUSTOMER' | 'UPDATE_CUSTOMER';
  payload: Record<string, unknown>;
  createdAt: string;
  status: 'PENDING' | 'ERROR';
  retryCount: number;
  lastError?: string;
}

export interface SyncMeta {
  key: string;
  value: string;
}

export class PosDatabase extends Dexie {
  catalog!: Table<PosCatalogItem, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super('PosOfflineDB');

    this.version(1).stores({
      catalog: '&id, productId, categoryId, sku, primaryBarcode, *allBarcodes, name',
      syncQueue: '++id, type, status, createdAt',
    });

    this.version(2).stores({
      catalog: '&id, productId, categoryId, sku, primaryBarcode, *allBarcodes, name, updatedAt',
      syncQueue: '++id, type, status, createdAt',
      syncMeta: '&key',
    }).upgrade(async tx => {
      const items = await tx.table('catalog').toArray();
      for (const item of items) {
        await tx.table('catalog').update(item.id, {
          stock: 0,
          updatedAt: new Date(0).toISOString(),
        });
      }
    });
  }
}

export const db = new PosDatabase();

export const SYNC_META_KEYS = {
  LAST_CATALOG_SYNC: 'lastCatalogSyncAt',
  LAST_CATALOG_COUNT: 'lastCatalogCount',
} as const;
